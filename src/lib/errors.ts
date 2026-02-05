export enum ErrorCode {
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_SESSION_EXPIRED = 'AUTH_SESSION_EXPIRED',
  AUTH_EMAIL_NOT_CONFIRMED = 'AUTH_EMAIL_NOT_CONFIRMED',
  AUTH_EMAIL_TAKEN = 'AUTH_EMAIL_TAKEN',
  AUTH_WEAK_PASSWORD = 'AUTH_WEAK_PASSWORD',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public recoverable: boolean = true,
    public userAction?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export const errorMessages: Partial<Record<ErrorCode, { title: string; message: string; action?: string }>> = {
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

export function getAuthErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error && typeof (error as { message: string }).message === 'string') {
    return (error as { message: string }).message
  }
  return 'An error occurred. Please try again.'
}
