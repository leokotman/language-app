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

  /**
   * Minimal deterministic flow: one card, flashcard only.
   * - Ensure pair + add one word → Study → enable only Flashcard → start → reveal → Good → session complete.
   * Avoids multiple cards, typing, and MC so we don't depend on several API round-trips or stale DOM.
   */
  test('start session, do one card (flashcard only), rate, see session complete', async ({ page }) => {
    test.setTimeout(60_000)
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
    await expect(page.getByText('e2e-study-word — e2e-study-translation').first()).toBeVisible({ timeout: 8000 })

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

    // Only Flashcard (word → translation) so we get a single deterministic path
    await page.getByRole('checkbox', { name: /Reverse flashcard/ }).click()
    await page.getByRole('checkbox', { name: /Written/ }).click()
    await page.getByRole('checkbox', { name: /Multiple choice/ }).click()
    await expect(page.getByRole('checkbox', { name: /Flashcard \(word → translation/ })).toBeChecked()

    const startBtn = page.getByTestId('study-start-session')
    await expect(startBtn).toBeEnabled({ timeout: 5000 })
    await startBtn.click()

    await expect(page.getByTestId('study-card')).toBeVisible({ timeout: 5000 })

    const card = page.getByTestId('study-card')
    for (let i = 0; i < 20; i++) {
      if (await page.getByTestId('study-session-complete').isVisible()) break

      const revealBtn = card.getByRole('button', { name: /Reveal (translation|word)/ })
      const checkBtn = card.getByRole('button', { name: 'Check' })
      const goodBtn = card.getByRole('button', { name: 'Good' })

      const sawReveal = await revealBtn.waitFor({ state: 'visible', timeout: 6000 }).then(() => true).catch(() => false)
      if (sawReveal) {
        await revealBtn.click()
        await goodBtn.click()
      } else if (await checkBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        await page.getByLabel('Translation').last().fill('x')
        await checkBtn.click()
        await goodBtn.click()
      } else if (await goodBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await goodBtn.click()
      } else {
        const recordBtn = card.getByTestId('study-speaking-record')
        const stopBtn = card.getByTestId('study-speaking-stop')
        if (await recordBtn.isVisible({ timeout: 500 }).catch(() => false)) {
          await recordBtn.click()
        } else if (await stopBtn.isVisible({ timeout: 500 }).catch(() => false)) {
          await stopBtn.click()
        } else {
          const mcOption = card.getByRole('button').filter({ hasNotText: /^(Again|Hard|Good|Easy|Check|Reveal|Play word|Record|Stop|Play back)/ }).first()
          if (await mcOption.isVisible({ timeout: 500 }).catch(() => false)) await mcOption.click()
          else break
        }
      }

      await page.getByTestId('study-session-complete').or(page.getByTestId('study-card')).waitFor({ state: 'visible', timeout: 10000 }).catch(() => {})
    }

    await expect(page.getByTestId('study-session-complete')).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('heading', { name: 'Session complete' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Back to study' })).toBeVisible()
  })
})
