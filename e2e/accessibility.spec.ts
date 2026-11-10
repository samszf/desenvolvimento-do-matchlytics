import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const publicRoutes = ['/', '/sign-in', '/sign-up', '/this-route-does-not-exist']
const protectedRoutes = ['/dashboard', '/matches', '/matches/new', '/matches/import', '/matches/1', '/analysis', '/maps', '/insights']

for (const route of publicRoutes) {
  test(`axe: ${route}`, async ({ page }, testInfo) => {
    await page.goto(route)
    await expect(page.locator('main#main-content')).toBeVisible()
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()
    await testInfo.attach(`axe-${route === '/' ? 'home' : route.replaceAll('/', '-') || 'page'}.json`, { body: JSON.stringify(results, null, 2), contentType: 'application/json' })
    const blockingViolations = results.violations.filter((violation) => ['critical', 'serious'].includes(violation.impact ?? ''))
    expect(blockingViolations, JSON.stringify(blockingViolations, null, 2)).toEqual([])
  })
}

test('estrutura de autenticação e labels', async ({ page }) => {
  await page.goto('/sign-in')
  await expect(page.locator('h1')).toBeVisible()
  await expect(page.locator('label[for]')).toHaveCount(2)
  await expect(page.locator('input[type="email"]')).toHaveAttribute('autocomplete', 'email')
  await expect(page.locator('input[type="password"]')).toHaveAttribute('autocomplete', 'current-password')
  await expect(page.getByRole('button', { name: 'Mostrar senha' })).toBeVisible()
})

test('skip link funciona com teclado', async ({ page }) => {
  await page.goto('/sign-in')
  await page.keyboard.press('Tab')
  const skipLink = page.getByRole('link', { name: 'Pular para o conteúdo principal' })
  await expect(skipLink).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#main-content')).toBeFocused()
})

test('controles principais mantêm foco visível no mobile', async ({ page }) => {
  await page.goto('/sign-in')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Pular para o conteúdo principal' })).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Matchlytics início' })).toBeFocused()
  const email = page.locator('input[type="email"]')
  const beforeFocus = await email.evaluate((element) => { const style = getComputedStyle(element); return { borderColor: style.borderTopColor, outline: style.outline, boxShadow: style.boxShadow } })
  await page.keyboard.press('Tab')
  await expect(email).toBeFocused()
  const afterFocus = await email.evaluate((element) => { const style = getComputedStyle(element); return { borderColor: style.borderTopColor, outline: style.outline, boxShadow: style.boxShadow } })
  expect(afterFocus).not.toEqual(beforeFocus)
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  expect(overflow).toBe(false)
})

for (const route of protectedRoutes) {
  test(`rota protegida redireciona sem autenticação: ${route}`, async ({ page }) => {
    await page.goto(route)
    await expect(page).toHaveURL(/\/sign-in/)
    await expect(page.getByRole('heading', { name: /Bem-vindo de volta|Crie sua conta/i })).toBeVisible()
  })
}

test('APIs protegidas retornam 401 sem sessão', async ({ request }) => {
  for (const route of ['/api/statistics/maps', '/api/insights']) {
    const response = await request.get(route)
    expect(response.status(), route).toBe(401)
    await expect(response.json()).resolves.toMatchObject({ error: 'Não autenticado' })
  }
})
