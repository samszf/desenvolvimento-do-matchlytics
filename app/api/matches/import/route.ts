import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { parseDemo } from '@/lib/demo-parser'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const form = await request.formData()
  const file = form.get('file')
  if (!(file instanceof File) || !file.name.toLowerCase().endsWith('.dem')) return NextResponse.json({ error: 'Selecione um arquivo .dem válido.' }, { status: 400 })
  if (file.size > 300 * 1024 * 1024) return NextResponse.json({ error: 'O arquivo excede o limite de 300 MB.' }, { status: 400 })
  try {
    return NextResponse.json(parseDemo(Buffer.from(await file.arrayBuffer())))
  } catch {
    return NextResponse.json({ error: 'Não foi possível analisar esta demo. Ela pode estar corrompida ou utilizar um formato ainda não suportado.' }, { status: 422 })
  }
}
