import { handleUpload } from '@vercel/blob/client'
import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { logDemoImportStage } from '@/lib/demo-import-logging'
import { DEMO_PATH_PATTERN } from '@/lib/demo-import-security'

export { DEMO_PATH_PATTERN } from '@/lib/demo-import-security'

class UploadAuthorizationError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
    this.name = 'UploadAuthorizationError'
  }
}

export async function POST(request: Request) {
  const requestId = randomUUID()
  const startedAt = Date.now()
  try {
    const body = await request.json()
    const jsonResponse = await handleUpload({
      token: process.env.BLOB_READ_WRITE_TOKEN,
      request,
      body,
      onBeforeGenerateToken: async (pathname) => {
        const session = await auth.api.getSession({ headers: await headers() })
        if (!session?.user) throw new UploadAuthorizationError('sessão ausente', 401)
        const match = DEMO_PATH_PATTERN.exec(pathname)
        if (!match || match[1] !== session.user.id) throw new UploadAuthorizationError('pathname não autorizado', 403)
        logDemoImportStage({ requestId, stage: 'AUTHENTICATION', result: 'success', startedAt })
        return {
          allowedContentTypes: ['application/octet-stream'],
          maximumSizeInBytes: 300 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ purpose: 'demo-import', userId: session.user.id }),
        }
      },
    })
    logDemoImportStage({ requestId, stage: 'UPLOAD_AUTHORIZATION', result: 'success', startedAt })
    return NextResponse.json(jsonResponse, { headers: { 'X-Request-Id': requestId } })
  } catch (error) {
    const status = error instanceof UploadAuthorizationError ? error.status : 500
    logDemoImportStage({ requestId, stage: 'UPLOAD_AUTHORIZATION', result: 'failure', startedAt, error })
    const message = status === 401 ? 'Não autenticado.' : status === 403 ? 'Caminho de upload não autorizado.' : 'Não foi possível autorizar o upload.'
    return NextResponse.json({ error: message }, { status, headers: { 'X-Request-Id': requestId } })
  }
}
