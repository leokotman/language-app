/**
 * Optional debug logging for offline/cache flow. Enable in browser console:
 *   localStorage.setItem('language-app-debug-offline', '1')
 * Then refresh; logs are prefixed with [offline]. Disable:
 *   localStorage.removeItem('language-app-debug-offline')
 */

const DEBUG_KEY = 'language-app-debug-offline'

export function isOfflineDebugEnabled(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(DEBUG_KEY) === '1'
  } catch {
    return false
  }
}

/** Call once at app load to confirm debug is on. If you set the flag but never see this, check origin/typo. */
function logDebugBanner(): void {
  if (typeof window === 'undefined') return
  try {
    if (localStorage.getItem(DEBUG_KEY) === '1') {
      console.log('[offline] debug logging enabled — set localStorage and refresh to see cache/sync logs')
    }
  } catch {
    /* ignore localStorage access errors */
  }
}
logDebugBanner()

export function offlineLog(message: string, data?: Record<string, unknown>): void {
  if (!isOfflineDebugEnabled()) return
  if (data !== undefined) {
    console.log('[offline]', message, data)
  } else {
    console.log('[offline]', message)
  }
}
