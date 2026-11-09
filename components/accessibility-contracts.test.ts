import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8')

describe('contratos de acessibilidade dos formulários', () => {
  it('mantém senha com nome acessível e estado de mostrar/ocultar', () => {
    const auth = source('components/auth-form.tsx')
    expect(auth).toContain('aria-label={showPassword ? \'Ocultar senha\' : \'Mostrar senha\'}')
    expect(auth).toContain('aria-pressed={showPassword}')
    expect(auth).toContain('aria-live="assertive"')
  })

  it('impede envio duplicado e anuncia carregamento', () => {
    const auth = source('components/auth-form.tsx')
    const match = source('components/match-form.tsx')
    const demo = source('components/demo-import-form.tsx')
    expect(auth).toContain('disabled={pending}')
    expect(auth).toContain('Enviando, aguarde.')
    expect(match).toContain('aria-busy={saving}')
    expect(match).toContain('Salvando partida, aguarde.')
    expect(demo).toContain('aria-busy={loading || saving}')
    expect(demo).toContain('Salvando partida, aguarde.')
  })

  it('associa jogador selecionado ao grupo de opções', () => {
    const demo = source('components/demo-import-form.tsx')
    expect(demo).toContain('role="radiogroup"')
    expect(demo).toContain('role="radio"')
    expect(demo).toContain('aria-checked={selected}')
  })

  it('mantém labels associados nos campos manuais', () => {
    const match = source('components/match-form.tsx')
    expect(match).toContain('htmlFor={name}')
    expect(match).toContain('aria-required={required}')
    expect(match).toContain('id="match-form-error"')
  })
})
