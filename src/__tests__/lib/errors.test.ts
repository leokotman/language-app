import { describe, it, expect } from 'vitest'
import { getAuthErrorMessage } from '@/lib/errors'

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
