import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'

function renderConfirmDialog(props: Parameters<typeof ConfirmDialog>[0]) {
  return render(
    <ThemeProvider theme={createTheme()}>
      <ConfirmDialog {...props} />
    </ThemeProvider>
  )
}

describe('ConfirmDialog', () => {
  it('renders title and message when open', () => {
    renderConfirmDialog({
      open: true,
      title: 'Delete item',
      message: 'Are you sure?',
      onConfirm: vi.fn(),
      onCancel: vi.fn(),
    })
    expect(screen.getByText('Delete item')).toBeInTheDocument()
    expect(screen.getByText('Are you sure?')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('calls onConfirm when Confirm is clicked', () => {
    const onConfirm = vi.fn()
    renderConfirmDialog({
      open: true,
      title: 'Confirm',
      message: 'Message',
      onConfirm,
      onCancel: vi.fn(),
    })
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel when Cancel is clicked', () => {
    const onCancel = vi.fn()
    renderConfirmDialog({
      open: true,
      title: 'Confirm',
      message: 'Message',
      onConfirm: vi.fn(),
      onCancel,
    })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('uses custom confirm and cancel labels', () => {
    renderConfirmDialog({
      open: true,
      title: 'Title',
      message: 'Message',
      confirmLabel: 'Delete',
      cancelLabel: 'Keep',
      onConfirm: vi.fn(),
      onCancel: vi.fn(),
    })
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Keep' })).toBeInTheDocument()
  })
})
