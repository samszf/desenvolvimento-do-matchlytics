import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { parseDemo } from '@/lib/demo-parser'
import { get } from '@vercel/blob'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

    const body = await request.json().catch(() => null) as { pathname?: string }
    if (!body?.pathname || !body.pathname.toLowerCase().endsWith('.dem')) {
      return NextResponse.json({ error: 'Envie uma demo válida pelo upload direto.' }, { status: 400 })
    }

    try {
      const blob = await get(body.pathname, { access: 'private' })
      if (!blob) return NextResponse.json({ error: 'Demo não encontrada no armazenamento.' }, { status: 404 })
      const parsed = await parseDemo(Buffer.from(await new Response(blob.stream).arrayBuffer()))
      return NextResponse.json(parsed)
    } catch {
      return NextResponse.json({ error: 'Não foi possível analisar esta demo. Ela pode estar corrompida ou utilizar um formato ainda não suportado.' }, { status: 422 })
    }
  } catch {
    return NextResponse.json({ error: 'O analisador encontrou um erro inesperado. Tente novamente.' }, { status: 500 })
  }
}
