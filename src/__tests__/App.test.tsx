import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '@/App'

describe('App', () => {
  it('renders navbar with app title', () => {
    render(
      <MemoryRouter>
        <AppRoutes />
      </MemoryRouter>
    )
    expect(screen.getByText('Language App')).toBeInTheDocument()
  })

  it('renders home content on /', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>
    )
    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Words' })).toBeInTheDocument()
    const main = screen.getByRole('main')
    expect(within(main).getAllByText('word 1').length).toBeGreaterThanOrEqual(1)
  })
})
