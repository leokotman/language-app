import { test, expect } from '@playwright/test'

test.describe('Home', () => {
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
