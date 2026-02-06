/** Erasable-friendly: use const object instead of enum */
export const ErrorCode = {
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
  AUTH_EMAIL_NOT_CONFIRMED: 'AUTH_EMAIL_NOT_CONFIRMED',
  AUTH_EMAIL_TAKEN: 'AUTH_EMAIL_TAKEN',
  AUTH_WEAK_PASSWORD: 'AUTH_WEAK_PASSWORD',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode]

export interface AppErrorShape {
  code: ErrorCode
  message: string
  name: string
  recoverable: boolean
  userAction?: string
}

export function createAppError(
  code: ErrorCode,
  message: string,
  recoverable: boolean = true,
  userAction?: string
): AppErrorShape {
  return {
    code,
    message,
    name: 'AppError',
    recoverable,
    userAction,
  }
}

/** For compatibility where code expects Error-like (e.g. throw). */
export function createAppErrorAsError(
  code: ErrorCode,
  message: string,
  recoverable: boolean = true,
  userAction?: string
): Error & AppErrorShape {
  const err = new Error(message) as Error & AppErrorShape
  err.name = 'AppError'
  err.code = code
  err.recoverable = recoverable
  err.userAction = userAction
  return err
}

export const errorMessages: Partial<
  Record<ErrorCode, { title: string; message: string; action?: string }>
> = {
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: {
    title: 'Invalid credentials',
    message: 'Email or password is incorrect.',
    action: 'Check your email and password and try again.',
  },
  [ErrorCode.AUTH_EMAIL_NOT_CONFIRMED]: {
    title: 'Confirm your email',
    message: 'Check your inbox for the confirmation link.',
    action: 'Click the link we sent you, then try signing in again.',
  },
  [ErrorCode.AUTH_EMAIL_TAKEN]: {
    title: 'Email already in use',
    message: 'An account with this email already exists.',
    action: 'Sign in instead or use a different email.',
  },
  [ErrorCode.AUTH_WEAK_PASSWORD]: {
    title: 'Password too weak',
    message: 'Use at least 6 characters.',
    action: 'Choose a longer password.',
  },
  [ErrorCode.NETWORK_ERROR]: {
    title: 'Connection error',
    message: 'Please check your internet connection.',
    action: 'Try again when you are back online.',
  },
  [ErrorCode.UNKNOWN_ERROR]: {
    title: 'Something went wrong',
    message: 'Please try again.',
    action: 'If the problem persists, try again later.',
  },
}

/**
 * Log an error with context for debugging. Use in catch blocks so failures are visible
 * without swallowing them silently. Safe to call with any thrown value.
 */
export function logError(context: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined
  console.error(`[${context}]`, message, stack != null ? { stack } : '')
}

export function getAuthErrorMessage(error: unknown): string {
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message: string }).message === 'string'
  ) {
    return (error as { message: string }).message
  }
  return 'An error occurred. Please try again.'
}

/**
 * True when the error indicates a Supabase/PostgREST table is missing (e.g. 404, relation does not exist).
 * Run the core data migration in Supabase SQL Editor when this happens.
 */
export function isSupabaseTableMissingError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const msg = (error as { message?: string }).message ?? ''
  const code = (error as { code?: string }).code ?? ''
  if (typeof msg !== 'string') return false
  const msgLower = msg.toLowerCase()
  if (msgLower.includes('does not exist') || msgLower.includes('relation')) return true
  if (code === '42P01' || code === 'PGRST301') return true
  return false
}

/** Shown when isSupabaseTableMissingError is true. */
export const SUPABASE_MIGRATION_SETUP_MESSAGE =
  'The database tables for this feature are missing. In your Supabase project: open **SQL Editor**, paste and run the contents of **docs/supabase-migrations/002_core_data_layer.sql** from this repo (see docs/SUPABASE_SETUP.md step 8).'
