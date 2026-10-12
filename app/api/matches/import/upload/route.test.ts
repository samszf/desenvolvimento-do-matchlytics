import { describe, expect, it } from 'vitest'
import { DEMO_PATH_PATTERN } from '../../../../../lib/demo-import-security'

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
