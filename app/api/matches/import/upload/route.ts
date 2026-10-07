import { handleUpload } from '@vercel/blob/client'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  const jsonResponse = await handleUpload({ token: process.env.BLOB_READ_WRITE_TOKEN, request, body, onBeforeGenerateToken: async () => ({ allowedContentTypes: ['*/*'], maximumSizeInBytes: 300 * 1024 * 1024, addRandomSuffix: true, tokenPayload: JSON.stringify({ purpose: 'demo-import' }) }), onUploadCompleted: async () => {} })
  return NextResponse.json(jsonResponse)
}
