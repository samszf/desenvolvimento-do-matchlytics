import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BlobAccessError, BlobNotFoundError, BlobStoreNotFoundError } from '@vercel/blob'
import { auth } from '@/lib/auth'
import { parseDemo } from '@/lib/demo-parser'
import { del, get, head } from '@vercel/blob'
import { POST } from './route'

vi.mock('@vercel/blob', () => ({
  BlobAccessError: class BlobAccessError extends Error {},
  BlobNotFoundError: class BlobNotFoundError extends Error {},
  BlobServiceNotAvailable: class BlobServiceNotAvailable extends Error {},
  BlobStoreNotFoundError: class BlobStoreNotFoundError extends Error {},
  BlobStoreSuspendedError: class BlobStoreSuspendedError extends Error {},
  del: vi.fn(),
  get: vi.fn(),
  head: vi.fn(),
}))

vi.mock('next/headers', () => ({ headers: vi.fn(async () => new Headers()) }))
vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: vi.fn() } } }))
vi.mock('@/lib/demo-parser', () => ({ parseDemo: vi.fn() }))

const validPathname = 'demos/user-1/match-random.dem'
const parsedDemo = { map: 'Mirage', playedAt: null, players: [{ steamId: '7656119' }], stats: {}, source: 'demo', warnings: [] }

function makeRequest(pathname: unknown = validPathname) {
  return new Request('http://localhost/api/matches/import', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ pathname }),
  })
}

async function post(pathname?: unknown) {
  const response = await POST(makeRequest(pathname))
  return { response, body: await response.json() }
}

describe('POST /api/matches/import', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: 'user-1' } } as never)
    vi.mocked(head).mockResolvedValue({ pathname: validPathname, size: 5 } as never)
    vi.mocked(get).mockResolvedValue({ stream: new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array([1, 2, 3])); controller.close() } }) } as never)
    vi.mocked(parseDemo).mockResolvedValue(parsedDemo as never)
    vi.mocked(del).mockResolvedValue(undefined)
  })

  it('usa o pathname recebido, lê o blob, processa a demo e só então limpa o temporário', async () => {
    const { response, body } = await post()

    expect(response.status).toBe(200)
    expect(response.headers.get('x-request-id')).toBeTruthy()
    expect(body).toEqual(parsedDemo)
    expect(head).toHaveBeenCalledWith(validPathname)
    expect(get).toHaveBeenCalledWith(validPathname, { access: 'private' })
    expect(parseDemo).toHaveBeenCalledOnce()
    expect(del).toHaveBeenCalledWith(validPathname)
    expect(vi.mocked(parseDemo).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(del).mock.invocationCallOrder[0])
  })

  it('retorna 401 sem ler o blob quando não há sessão', async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null as never)
    const { response, body } = await post()
    expect(response.status).toBe(401)
    expect(body.error).toBe('Não autenticado.')
    expect(head).not.toHaveBeenCalled()
  })

  it('rejeita pathname inválido sem consultar o armazenamento', async () => {
    const { response } = await post('../user-1/match.dem')
    expect(response.status).toBe(400)
    expect(head).not.toHaveBeenCalled()
  })

  it('nega pathname pertencente a outro usuário', async () => {
    const { response } = await post('demos/user-2/match.dem')
    expect(response.status).toBe(403)
    expect(head).not.toHaveBeenCalled()
  })

  it('mapeia BlobNotFoundError para 404', async () => {
    vi.mocked(head).mockRejectedValue(new BlobNotFoundError())
    const { response } = await post()
    expect(response.status).toBe(404)
    expect(get).not.toHaveBeenCalled()
  })

  it('diferencia Store ausente de arquivo inexistente', async () => {
    vi.mocked(head).mockRejectedValue(new BlobStoreNotFoundError())
    const { response, body } = await post()
    expect(response.status).toBe(503)
    expect(body.error).toContain('armazenamento')
  })

  it('não mascara falha inesperada de leitura como arquivo inexistente', async () => {
    vi.mocked(get).mockRejectedValue(new Error('falha interna de leitura'))
    const { response, body } = await post()
    expect(response.status).toBe(500)
    expect(body.error).not.toContain('falha interna')
    expect(del).not.toHaveBeenCalled()
  })

  it('retorna 422 para falha do parser, preserva detalhes só no log e limpa após a tentativa', async () => {
    const parserError = new Error('EntityNotFound')
    parserError.name = 'DemoParserOperationError'
    Object.assign(parserError, { operation: 'parseEvent:player_death', cause: new Error('EntityNotFound') })
    vi.mocked(parseDemo).mockRejectedValue(parserError)
    const log = vi.spyOn(console, 'info').mockImplementation(() => {})

    const { response, body } = await post()
    const events = log.mock.calls.map(([entry]) => {
      try { return JSON.parse(String(entry).replace(/^\[demo-import\] /, '')) } catch { return null }
    }).filter(Boolean)
    const parserEvent = events.find((event) => event.stage === 'DEMO_PARSE' && event.result === 'failure')

    expect(response.status).toBe(422)
    expect(body.error).not.toContain('EntityNotFound')
    expect(parserEvent).toMatchObject({ parserOperation: 'parseEvent:player_death', message: 'EntityNotFound' })
    expect(parserEvent.requestId).toBe(response.headers.get('x-request-id'))
    expect(del).toHaveBeenCalledWith(validPathname)
    log.mockRestore()
  })

  it('retorna 500 para exceção inesperada do parser', async () => {
    const parserError = new Error('internal parser defect')
    parserError.name = 'DemoParserOperationError'
    Object.assign(parserError, { operation: 'parseEvent:player_death', cause: new Error('internal parser defect') })
    vi.mocked(parseDemo).mockRejectedValue(parserError)
    const { response, body } = await post()
    expect(response.status).toBe(500)
    expect(body.error).not.toContain('internal parser defect')
    expect(del).toHaveBeenCalledWith(validPathname)
  })

  it('não transforma falha de limpeza em falha de processamento', async () => {
    vi.mocked(del).mockRejectedValue(new Error('cleanup failed'))
    const { response, body } = await post()
    expect(response.status).toBe(200)
    expect(body).toEqual(parsedDemo)
  })

  it('classifica BlobAccessError como indisponibilidade e não revela detalhes', async () => {
    vi.mocked(head).mockRejectedValue(new BlobAccessError())
    const { response, body } = await post()
    expect(response.status).toBe(503)
    expect(body.error).not.toContain('secret')
  })
})
