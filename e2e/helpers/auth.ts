import type { Page } from '@playwright/test'

const LOGIN_SUCCESS_TIMEOUT_MS = 15000

/**
 * Log in via the app login page. Fills email/password, submits, then waits for
 * either success (navbar visible) or failure (error alert).
 * @throws If login fails (invalid credentials or network), with message from the alert or a default.
 */
export async function loginWithCredentials(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()

  const alert = page.getByRole('alert')
  const navbar = page.getByRole('banner').getByText('Language App')

  let result: 'success' | 'error' = 'success'
  try {
    result = await Promise.race([
      navbar.waitFor({ state: 'visible', timeout: LOGIN_SUCCESS_TIMEOUT_MS }).then(() => 'success' as const),
      alert.waitFor({ state: 'visible', timeout: LOGIN_SUCCESS_TIMEOUT_MS }).then(() => 'error' as const),
    ])
  } catch {
    if (await alert.isVisible().catch(() => false)) result = 'error'
    else
      throw new Error(
        `Login timed out after ${LOGIN_SUCCESS_TIMEOUT_MS}ms. Check E2E_TEST_EMAIL, E2E_TEST_PASSWORD and network.`
      )
  }

  if (result === 'error') {
    const message = await alert.textContent().catch(() => 'Unknown error')
    throw new Error(`Login failed: ${message?.trim() ?? 'Invalid credentials or server error.'}`)
  }
}

/** True when E2E auth env vars are set (authenticated tests will run). */
export function hasE2EAuthEnv(): boolean {
  return !!(process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD)
}
