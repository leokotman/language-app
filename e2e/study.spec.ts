import { test, expect } from '@playwright/test'
import { loginWithCredentials, hasE2EAuthEnv } from './helpers/auth'

test.describe('Study (unauthenticated)', () => {
  test('redirects to login when visiting /study', async ({ page }) => {
    await page.goto('/study')
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible()
  })
})

test.describe('Study (session flow)', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!hasE2EAuthEnv(), 'E2E_TEST_EMAIL and E2E_TEST_PASSWORD must be set for authenticated E2E')
    await loginWithCredentials(
      page,
      process.env.E2E_TEST_EMAIL!,
      process.env.E2E_TEST_PASSWORD!
    )
  })

  test('start session, do one card (flashcard), rate, see session complete', async ({ page }) => {
    await page.getByRole('link', { name: 'Settings' }).click()
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

    const pairSelect = page.getByLabel('Add language pair')
    if (await pairSelect.isVisible()) {
      await pairSelect.click()
      await page.getByRole('option', { name: /Russian.*English|English.*Russian/ }).first().click()
      await page.getByRole('button', { name: 'Add' }).click()
      await expect(page.getByText(/Russian|English/)).toBeVisible({ timeout: 5000 })
    }

    await page.getByRole('link', { name: 'My Library' }).click()
    await expect(page.getByRole('heading', { name: 'My Library' })).toBeVisible()

    const mayShowNoPairs = page.getByText('Add at least one language pair')
    if (await mayShowNoPairs.isVisible()) {
      test.skip(true, 'Test user has no language pair; add one in Settings first')
    }

    await expect(
      page.getByTestId('library-list').or(page.getByTestId('library-empty'))
    ).toBeVisible({ timeout: 15000 })

    const wordInput = page.getByLabel('Word').first()
    const translationInput = page.getByLabel('Translation').first()
    await wordInput.fill('e2e-study-word')
    await translationInput.fill('e2e-study-translation')

    const libraryPairSelect = page.getByLabel('Language pair').first()
    await libraryPairSelect.click()
    await page.getByRole('option', { name: /Russian.*English|English.*Russian/ }).first().click()

    const directionSelect = page.getByLabel('Direction').first()
    await directionSelect.click()
    await page.getByRole('option', { name: /Russian.*English|English.*Russian/ }).first().click()

    await page.getByRole('button', { name: 'Add' }).click()
    await expect(page.getByText('e2e-study-word — e2e-study-translation')).toBeVisible({ timeout: 8000 })

    await page.getByRole('link', { name: 'Study' }).click()
    await expect(page.getByRole('heading', { name: 'Study' })).toBeVisible()

    await expect(
      page.getByTestId('study-due-loading').or(page.getByTestId('study-setup'))
    ).toBeVisible({ timeout: 15000 })

    if (await page.getByTestId('study-due-loading').isVisible()) {
      await expect(page.getByTestId('study-setup')).toBeVisible({ timeout: 10000 })
    }

    const noCardsDue = page.getByText('No cards due today for this language pair')
    if (await noCardsDue.isVisible()) {
      test.skip(true, 'No cards due for selected pair; seed data or add word in Library first')
    }

    await expect(page.getByTestId('study-setup')).toBeVisible()
    await expect(page.getByText(/\d+ card(s)? due today/)).toBeVisible()

    const startBtn = page.getByTestId('study-start-session')
    await expect(startBtn).toBeEnabled({ timeout: 5000 })
    await startBtn.click()

    await expect(page.getByTestId('study-card')).toBeVisible({ timeout: 5000 })

    const revealBtn = page.getByRole('button', { name: /Reveal (translation|word)/ })
    if (await revealBtn.isVisible()) {
      await revealBtn.click()
      await page.getByRole('button', { name: 'Good' }).click()
    } else {
      const checkBtn = page.getByRole('button', { name: 'Check' })
      if (await checkBtn.isVisible()) {
        await page.getByLabel('Translation').fill('e2e-study-translation')
        await checkBtn.click()
        await page.getByRole('button', { name: 'Good' }).click()
      } else {
        const optionBtn = page.getByRole('button', { name: 'e2e-study-translation' })
        if (await optionBtn.isVisible()) {
          await optionBtn.click()
          await page.getByRole('button', { name: 'Good' }).click()
        } else {
          await page.getByRole('button', { name: 'Good' }).first().click()
        }
      }
    }

    await expect(page.getByTestId('study-session-complete')).toBeVisible({ timeout: 10000 })
    await expect(page.getByRole('heading', { name: 'Session complete' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Back to study' })).toBeVisible()
  })
})
