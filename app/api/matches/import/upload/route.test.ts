import { beforeEach, describe, expect, it, vi } from 'vitest'
import { handleUpload } from '@vercel/blob/client'
import { auth } from '@/lib/auth'
import { DEMO_PATH_PATTERN } from '../../../../../lib/demo-import-security'
import { POST } from './route'

vi.mock('@vercel/blob/client', () => ({ handleUpload: vi.fn() }))
vi.mock('next/headers', () => ({ headers: vi.fn(async () => new Headers()) }))
vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: vi.fn() } } }))

describe('caminhos de demos', () => {
  it('aceita caminho válido com proprietário', () => {
    expect(DEMO_PATH_PATTERN.exec('demos/user-1/match.dem')?.[1]).toBe('user-1')
  })

  it('rejeita arquivo sem proprietário', () => {
    expect(DEMO_PATH_PATTERN.test('demos/match.dem')).toBe(false)
  })

  it('rejeita caminho malformado', () => {
    expect(DEMO_PATH_PATTERN.test('../user-1/match.dem')).toBe(false)
    expect(DEMO_PATH_PATTERN.test('demos/user-1/match.txt')).toBe(false)
  })

  it('identifica usuário proprietário', () => {
    const match = DEMO_PATH_PATTERN.exec('demos/user-1/match.dem')
    expect(match?.[1] === 'user-1').toBe(true)
  })

  it('nega acesso cruzado', () => {
    const match = DEMO_PATH_PATTERN.exec('demos/user-1/match.dem')
    expect(match?.[1] === 'user-2').toBe(false)
  })
})

describe('POST /api/matches/import/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: 'user-1' } } as never)
  })

  function configureUpload(pathname: string) {
    vi.mocked(handleUpload).mockImplementation(async (options) => {
      const handler = options as unknown as { onBeforeGenerateToken: (path: string) => Promise<unknown> }
      const authorization = await handler.onBeforeGenerateToken(pathname)
      return { authorization } as never
    })
  }

  async function uploadRequest() {
    return POST(new Request('http://localhost/api/matches/import/upload', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'blob.generate-client-token' }),
    }))
  }

  it('autoriza um upload válido para o usuário autenticado', async () => {
    configureUpload('demos/user-1/match.dem')
    const response = await uploadRequest()
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.authorization).toMatchObject({
      allowedContentTypes: ['application/octet-stream'],
      maximumSizeInBytes: 300 * 1024 * 1024,
      addRandomSuffix: true,
      tokenPayload: JSON.stringify({ purpose: 'demo-import', userId: 'user-1' }),
    })
  })

  it('retorna 401 quando o upload não tem sessão', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null as never)
    configureUpload('demos/user-1/match.dem')
    const response = await uploadRequest()
    expect(response.status).toBe(401)
    expect((await response.json()).error).toBe('Não autenticado.')
  })

  it('retorna 403 para pathname de outro usuário', async () => {
    configureUpload('demos/user-2/match.dem')
    const response = await uploadRequest()
    expect(response.status).toBe(403)
    expect((await response.json()).error).toBe('Caminho de upload não autorizado.')
  })
})
