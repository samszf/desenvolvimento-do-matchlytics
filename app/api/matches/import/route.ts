import { del, get } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { parseDemo } from '@/lib/demo-parser'
import { DEMO_PATH_PATTERN } from '@/lib/demo-import-security'

const TEMPORARY_DEMO_PATH = DEMO_PATH_PATTERN

export async function POST(request: Request) {
  let pathname: string | undefined
  let blobExists = false
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  try {
    const body = await request.json() as { pathname?: unknown }
    pathname = typeof body.pathname === 'string' ? body.pathname : undefined

    if (!pathname) return NextResponse.json({ error: 'Demo não encontrada.' }, { status: 400 })
    const pathMatch = TEMPORARY_DEMO_PATH.exec(pathname)
    if (!pathMatch) return NextResponse.json({ error: 'Demo não encontrada.' }, { status: 400 })
    if (pathMatch[1] !== session.user.id) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })

    if (process.env.NODE_ENV !== 'production') {
      console.log('[demo-import] blob criado:', pathname)
      console.log('[demo-import] iniciando análise:', pathname)
    }

    const blob = await get(pathname, { access: 'private' })
    if (!blob) return NextResponse.json({ error: 'Demo não encontrada no armazenamento.' }, { status: 404 })
    blobExists = true

    const buffer = Buffer.from(await new Response(blob.stream).arrayBuffer())
    const parsed = await parseDemo(buffer)

    if (process.env.NODE_ENV !== 'production') console.log('[demo-import] análise concluída')
    return NextResponse.json(parsed)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Falha ao analisar demo.' }, { status: 422 })
  } finally {
    if (blobExists && pathname) {
      try {
        if (process.env.NODE_ENV !== 'production') console.log('[demo-import] removendo demo temporária:', pathname)
        await del(pathname)
        if (process.env.NODE_ENV !== 'production') console.log('[demo-import] demo removida')
      } catch (cleanupError) {
        console.error('[demo-import] falha ao remover demo temporária:', cleanupError)
      }
    }
  }
}
