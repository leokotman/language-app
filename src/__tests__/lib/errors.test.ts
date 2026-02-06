import { describe, it, expect } from 'vitest'
import { getAuthErrorMessage, isSupabaseTableMissingError } from '@/lib/errors'

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

describe('isSupabaseTableMissingError', () => {
  it('returns true for "does not exist" message', () => {
    expect(isSupabaseTableMissingError({ message: 'relation "user_languages" does not exist' })).toBe(true)
  })

  it('returns true for PostgreSQL 42P01 code', () => {
    expect(isSupabaseTableMissingError({ message: 'x', code: '42P01' })).toBe(true)
  })

  it('returns false for generic error', () => {
    expect(isSupabaseTableMissingError({ message: 'Network failure' })).toBe(false)
  })

  it('returns false for null/undefined', () => {
    expect(isSupabaseTableMissingError(null)).toBe(false)
    expect(isSupabaseTableMissingError(undefined)).toBe(false)
  })
})
