import { upload } from '@vercel/blob/client'

export async function uploadDemoAndImport(file: File, userId: string) {
  const uploadedBlob = await upload(`demos/${userId}/${file.name}`, file, {
    access: 'private',
    contentType: 'application/octet-stream',
    handleUploadUrl: '/api/matches/import/upload',
  })
  const uploadedPathname = uploadedBlob.pathname
  const processingPathname = uploadedPathname
  const requestId = crypto.randomUUID()

  console.info('[demo-import] upload-complete', JSON.stringify({
    requestId,
    uploadedPathname,
    processingPathname,
    pathnamesMatch: uploadedPathname === processingPathname,
  }))

  if (uploadedPathname !== processingPathname) {
    throw new Error('O caminho do upload divergiu do caminho enviado para processamento.')
  }

  return fetch('/api/matches/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Request-Id': requestId },
    body: JSON.stringify({ pathname: processingPathname }),
  })
}
