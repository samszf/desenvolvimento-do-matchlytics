import { beforeEach, describe, expect, it, vi } from 'vitest'
import { upload } from '@vercel/blob/client'
import { uploadDemoAndImport } from './demo-import-client'

vi.mock('@vercel/blob/client', () => ({ upload: vi.fn() }))

describe('uploadDemoAndImport', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 200 })))
  })

  it.each([
    'demos/user-1/furia-vs-vitality.dem',
    'demos/user-1/furia-vs-vitality-m1-inferno-3WioTefTtc2ZZSA1gPayLlgu2bPkDv.dem',
  ])('envia exatamente o pathname retornado pelo Blob: %s', async (pathname) => {
    vi.mocked(upload).mockResolvedValue({ pathname } as never)
    const file = new File(['demo'], 'furia-vs-vitality.dem')

    await uploadDemoAndImport(file, 'user-1')

    expect(upload).toHaveBeenCalledWith('demos/user-1/furia-vs-vitality.dem', file, expect.objectContaining({
      access: 'private',
      handleUploadUrl: '/api/matches/import/upload',
    }))
    expect(fetch).toHaveBeenCalledWith('/api/matches/import', expect.objectContaining({
      body: JSON.stringify({ pathname }),
    }))
  })
})
