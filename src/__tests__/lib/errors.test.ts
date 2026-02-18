import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  createAppError,
  createAppErrorAsError,
  getAuthErrorMessage,
  isNetworkError,
  isSupabaseTableMissingError,
  logError,
  ErrorCode,
} from '@/lib/errors'

describe('logError', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does not throw when given an Error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => logError('test', new Error('msg'))).not.toThrow()
    expect(spy).toHaveBeenCalledWith('[test]', 'msg', expect.any(Object))
  })

  it('does not throw when given a non-Error value', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => logError('ctx', 'string error')).not.toThrow()
    expect(spy).toHaveBeenCalled()
  })
})

describe('getAuthErrorMessage', () => {
  it('returns message from error object', () => {
    expect(getAuthErrorMessage({ message: 'Invalid login credentials' })).toBe('Invalid login credentials')
  })

  it('returns fallback for non-object', () => {
    expect(getAuthErrorMessage(null)).toBe('An error occurred. Please try again.')
    expect(getAuthErrorMessage(undefined)).toBe('An error occurred. Please try again.')
  })

  it('returns fallback when message is not a string', () => {
    expect(getAuthErrorMessage({ message: 123 })).toBe('An error occurred. Please try again.')
  })
})

describe('createAppError', () => {
  it('returns shape with code, message, recoverable, userAction', () => {
    const err = createAppError(ErrorCode.AUTH_INVALID_CREDENTIALS, 'Bad login', false, 'Retry')
    expect(err.code).toBe(ErrorCode.AUTH_INVALID_CREDENTIALS)
    expect(err.message).toBe('Bad login')
    expect(err.recoverable).toBe(false)
    expect(err.userAction).toBe('Retry')
  })
})

describe('createAppErrorAsError', () => {
  it('returns Error-like with code and message', () => {
    const err = createAppErrorAsError(ErrorCode.NETWORK_ERROR, 'Offline')
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toBe('Offline')
    expect(err.code).toBe(ErrorCode.NETWORK_ERROR)
  })
})

describe('isSupabaseTableMissingError', () => {
  it('returns true for "does not exist" or "relation" message', () => {
    expect(isSupabaseTableMissingError({ message: 'relation "user_languages" does not exist' })).toBe(true)
    expect(isSupabaseTableMissingError({ message: 'relation xyz missing' })).toBe(true)
  })

  it('returns true for 42P01 or PGRST301 code', () => {
    expect(isSupabaseTableMissingError({ message: 'x', code: '42P01' })).toBe(true)
    expect(isSupabaseTableMissingError({ message: 'x', code: 'PGRST301' })).toBe(true)
  })

  it('returns false for generic error or non-string message', () => {
    expect(isSupabaseTableMissingError({ message: 'Network failure' })).toBe(false)
    expect(isSupabaseTableMissingError({ message: 123 })).toBe(false)
  })

  it('returns false for null/undefined', () => {
    expect(isSupabaseTableMissingError(null)).toBe(false)
    expect(isSupabaseTableMissingError(undefined)).toBe(false)
  })
})

describe('isNetworkError', () => {
  it('returns true for "Failed to fetch" message', () => {
    expect(isNetworkError(new Error('Failed to fetch'))).toBe(true)
    expect(isNetworkError({ message: 'Failed to fetch' })).toBe(true)
  })

  it('returns true for TypeError with fetch', () => {
    expect(isNetworkError(new TypeError('Failed to fetch'))).toBe(true)
  })

  it('returns true for network request failed', () => {
    expect(isNetworkError({ message: 'Network request failed' })).toBe(true)
  })

  it('returns false for generic error', () => {
    expect(isNetworkError(new Error('Invalid credentials'))).toBe(false)
  })

  it('returns false for null/undefined', () => {
    expect(isNetworkError(null)).toBe(false)
    expect(isNetworkError(undefined)).toBe(false)
  })
})
