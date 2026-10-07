import { get } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { parseDemo } from '@/lib/demo-parser'

export async function POST(request: Request) {
  try {
    const { pathname } = await request.json() as { pathname?: string }
    if (!pathname) return NextResponse.json({ error: 'Demo não encontrada.' }, { status: 400 })
    const blob = await get(pathname, { access: 'private' })
    if (!blob) return NextResponse.json({ error: 'Demo não encontrada no armazenamento.' }, { status: 404 })
    const parsed = await parseDemo(Buffer.from(await new Response(blob.stream).arrayBuffer()))
    return NextResponse.json(parsed)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Falha ao analisar demo.' }, { status: 422 })
  }
}
