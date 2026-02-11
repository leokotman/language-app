import { test, expect } from '@playwright/test'
import { loginWithCredentials, hasE2EAuthEnv } from './helpers/auth'

test.describe('Home (unauthenticated)', () => {
  test('redirects to login when visiting /', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  })
})

test.describe('Home (authenticated)', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasE2EAuthEnv(), 'E2E_TEST_EMAIL and E2E_TEST_PASSWORD must be set for authenticated E2E')
    await loginWithCredentials(
      page,
      process.env.E2E_TEST_EMAIL!,
      process.env.E2E_TEST_PASSWORD!
    )
  })

  test('has navbar and home content', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('banner').getByText('Language App')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible()
    await expect(page.getByRole('main').getByText('word 1').first()).toBeVisible()
  })

  test('navigates to My Library', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('link', { name: 'My Library' }).click()
    await expect(page.getByRole('heading', { name: 'My Library' })).toBeVisible()
  })
})
