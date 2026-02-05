import { describe, it, expect, vi } from 'vitest'
import type { ReactElement } from 'react'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeModeProvider } from '@/theme/ThemeModeContext'
import { AppRoutes } from '@/App'

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    loading: false,
    user: { email: 'test@example.com' },
    session: {},
    signOut: vi.fn(),
  }),
}))

function renderWithProviders(ui: ReactElement, options?: { initialEntries?: string[] }) {
  return render(
    <ThemeModeProvider>
      <MemoryRouter initialEntries={options?.initialEntries ?? ['/']}>
        {ui}
      </MemoryRouter>
    </ThemeModeProvider>
  )
}

describe('App', () => {
  it('renders navbar with app title', () => {
    renderWithProviders(<AppRoutes />)
    expect(screen.getByText('Language App')).toBeInTheDocument()
  })

  it('renders home content on /', () => {
    renderWithProviders(<AppRoutes />, { initialEntries: ['/'] })
    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Words' })).toBeInTheDocument()
    const main = screen.getByRole('main')
    expect(within(main).getAllByText('word 1').length).toBeGreaterThanOrEqual(1)
  })
})
