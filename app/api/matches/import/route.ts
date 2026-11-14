import { BlobAccessError, BlobNotFoundError, BlobServiceNotAvailable, BlobStoreNotFoundError, BlobStoreSuspendedError, del, get, head } from '@vercel/blob'
import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { parseDemo } from '@/lib/demo-parser'
import { logDemoImportStage } from '@/lib/demo-import-logging'
import { DEMO_PATH_PATTERN } from '@/lib/demo-import-security'

class DemoImportRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
    this.name = 'DemoImportRequestError'
  }
}

function getResponseForError(error: unknown) {
  if (error instanceof DemoImportRequestError) return { status: error.status, message: error.message }
  if (error instanceof BlobNotFoundError) return { status: 404, message: 'Demo não encontrada no armazenamento.' }
  if (error instanceof BlobAccessError || error instanceof BlobStoreNotFoundError || error instanceof BlobStoreSuspendedError) {
    return { status: 503, message: 'O armazenamento está temporariamente indisponível. Tente novamente.' }
  }
  if (error instanceof BlobServiceNotAvailable) return { status: 503, message: 'O armazenamento está temporariamente indisponível. Tente novamente.' }
  if (error instanceof Error && error.name === 'DemoParserOperationError') {
    const cause = error.cause instanceof Error ? error.cause : error
    const parserMessage = cause.message.toLowerCase()
    if (/entitynotfound|invalid.*demo|wasm trap|unreachable|unexpected end/.test(parserMessage)) {
      return { status: 422, message: 'Não foi possível interpretar esta demo. Confira se o arquivo é uma demo válida do CS2.' }
    }
  }
  return { status: 500, message: 'Não foi possível processar a demo. Tente novamente.' }
}

export async function POST(request: Request) {
  const requestId = randomUUID()
  const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'X-Request-Id': requestId } })
  let pathname: string | undefined
  let authenticatedUserId: string | undefined
  let blobExists = false
  let stage: Parameters<typeof logDemoImportStage>[0]['stage'] = 'AUTHENTICATION'
  let startedAt = Date.now()

  try {
    const session = await auth.api.getSession({ headers: await headers() })
    authenticatedUserId = session?.user?.id
    logDemoImportStage({ requestId, stage, result: authenticatedUserId ? 'success' : 'failure', startedAt })
    if (!authenticatedUserId) return json({ error: 'Não autenticado.' }, 401)

    stage = 'VALIDATE_UPLOAD'
    startedAt = Date.now()
    let body: { pathname?: unknown }
    try {
      body = await request.json() as { pathname?: unknown }
    } catch (error) {
      logDemoImportStage({ requestId, stage, result: 'failure', startedAt, error })
      return json({ error: 'Envie os dados da demo em um formato válido.' }, 400)
    }
    if (typeof body.pathname !== 'string' || !body.pathname) {
      logDemoImportStage({ requestId, stage, result: 'failure', startedAt, error: new DemoImportRequestError('pathname ausente', 400) })
      return json({ error: 'Demo não encontrada.' }, 400)
    }
    pathname = body.pathname
    logDemoImportStage({ requestId, stage, result: 'success', startedAt })

    stage = 'VALIDATE_PATHNAME'
    startedAt = Date.now()
    const pathMatch = DEMO_PATH_PATTERN.exec(pathname)
    if (!pathMatch) {
      logDemoImportStage({ requestId, stage, result: 'failure', startedAt, error: new DemoImportRequestError('pathname inválido', 400), pathname })
      return json({ error: 'Demo não encontrada.' }, 400)
    }
    if (pathMatch[1] !== authenticatedUserId) {
      logDemoImportStage({ requestId, stage, result: 'failure', startedAt, error: new DemoImportRequestError('proprietário incompatível', 403), pathname })
      return json({ error: 'Acesso negado.' }, 403)
    }
    logDemoImportStage({ requestId, stage, result: 'success', startedAt })

    stage = 'BLOB_HEAD'
    startedAt = Date.now()
    const metadata = await head(pathname)
    logDemoImportStage({ requestId, stage, result: 'success', startedAt, details: { blobSize: metadata.size } })

    stage = 'BLOB_READ'
    startedAt = Date.now()
    const blob = await get(pathname, { access: 'private' })
    if (!blob) throw new BlobNotFoundError()
    blobExists = true
    const buffer = Buffer.from(await new Response(blob.stream).arrayBuffer())
    logDemoImportStage({ requestId, stage, result: 'success', startedAt, details: { bytesRead: buffer.byteLength } })

    stage = 'DEMO_PARSE'
    startedAt = Date.now()
    const parsed = await parseDemo(buffer)
    logDemoImportStage({ requestId, stage, result: 'success', startedAt })

    stage = 'PLAYER_EXTRACTION'
    startedAt = Date.now()
    const playerCount = Array.isArray(parsed.players) ? parsed.players.length : 0
    logDemoImportStage({ requestId, stage, result: playerCount ? 'success' : 'failure', startedAt, details: { playerCount, reason: playerCount ? null : 'no-player-entities' } })
    return json(parsed)
  } catch (error) {
    logDemoImportStage({ requestId, stage, result: 'failure', startedAt, error, pathname })
    const response = getResponseForError(error)
    return json({ error: response.message }, response.status)
  } finally {
    if (blobExists && pathname) {
      stage = 'CLEANUP'
      startedAt = Date.now()
      try {
        await del(pathname)
        logDemoImportStage({ requestId, stage, result: 'success', startedAt })
      } catch (error) {
        logDemoImportStage({ requestId, stage, result: 'failure', startedAt, error, pathname })
      }
    }
  }
}
