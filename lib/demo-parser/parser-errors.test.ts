import { beforeEach, describe, expect, it, vi } from 'vitest'
import { parseDemo } from './index'

const parser = vi.hoisted(() => ({
  parseEvent: vi.fn(),
  parseHeader: vi.fn(),
  parsePlayerInfo: vi.fn(),
  parseTicks: vi.fn(),
}))

vi.mock('@laihoe/demoparser2', () => parser)

describe('diagnóstico de operações do parser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    parser.parseHeader.mockReturnValue({ map_name: 'de_mirage' })
    parser.parsePlayerInfo.mockReturnValue([])
    parser.parseEvent.mockImplementation(() => { throw new Error('EntityNotFound') })
    parser.parseTicks.mockReturnValue([])
  })

  it('preserva o nome do erro e identifica a operação do parser que falhou', async () => {
    await expect(parseDemo(Buffer.from([1, 2, 3]))).rejects.toMatchObject({
      name: 'DemoParserOperationError',
      operation: 'parseEvent:player_death',
      cause: expect.objectContaining({ message: 'EntityNotFound' }),
    })
  })
})
