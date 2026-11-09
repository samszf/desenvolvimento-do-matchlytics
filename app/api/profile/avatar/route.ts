import { put } from '@vercel/blob'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const formData = await request.formData()
  const file = formData.get('file')
  if (!(file instanceof File) || !file.type.startsWith('image/')) return NextResponse.json({ error: 'Envie uma imagem válida.' }, { status: 400 })
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'A imagem deve ter no máximo 5 MB.' }, { status: 400 })
  const blob = await put(`profiles/${session.user.id}/avatar-${Date.now()}`, file, { access: 'public', addRandomSuffix: true, contentType: file.type })
  return NextResponse.json({ url: blob.url })
}
