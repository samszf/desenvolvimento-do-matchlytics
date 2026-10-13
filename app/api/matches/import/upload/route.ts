import { handleUpload } from '@vercel/blob/client'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { DEMO_PATH_PATTERN } from '@/lib/demo-import-security'

export { DEMO_PATH_PATTERN } from '@/lib/demo-import-security'

export async function POST(request: Request) {
  const body = await request.json()
  const jsonResponse = await handleUpload({ token: process.env.BLOB_READ_WRITE_TOKEN, request, body, onBeforeGenerateToken: async (pathname) => {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) throw new Error('Não autenticado')
    const match = DEMO_PATH_PATTERN.exec(pathname)
    if (!match || match[1] !== session.user.id) throw new Error('Caminho de demo inválido')
    return { allowedContentTypes: ['application/octet-stream'], maximumSizeInBytes: 300 * 1024 * 1024, addRandomSuffix: true, tokenPayload: JSON.stringify({ purpose: 'demo-import', userId: session.user.id }) }
  }, onUploadCompleted: async () => {} })
  return NextResponse.json(jsonResponse)
}
