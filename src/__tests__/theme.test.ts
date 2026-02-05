import { describe, it, expect } from 'vitest'
import { theme } from '@/theme/theme'

describe('theme', () => {
  it('has primary color', () => {
    expect(theme.palette.primary.main).toBe('#1976d2')
  })

  it('has typography font family', () => {
    expect(theme.typography.fontFamily).toContain('Roboto')
  })
})
