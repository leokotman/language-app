import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Box, TextField, Button, Typography, Link, Alert, Paper } from '@mui/material'
import { supabase } from '@/lib/supabase'
import { getAuthErrorMessage, isNetworkError, logError, OFFLINE_AUTH_MESSAGE } from '@/lib/errors'
import {
  sanitizeEmail,
  clampAndStripControlChars,
  MAX_EMAIL_LENGTH,
} from '@/lib/sanitize'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setError(OFFLINE_AUTH_MESSAGE)
      return
    }
    const safeEmail = sanitizeEmail(email)
    setLoading(true)
    try {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(safeEmail, {
        redirectTo: `${window.location.origin}/settings`,
      })
      if (authError) {
        setError(getAuthErrorMessage(authError))
        return
      }
      setEmail(safeEmail)
      setSent(true)
    } catch (err) {
      logError('ForgotPasswordPage.handleSubmit', err)
      setError(isNetworkError(err) ? OFFLINE_AUTH_MESSAGE : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Check your email
        </Typography>
        <Paper sx={{ p: 3, mt: 2 }}>
          <Alert severity="success" sx={{ mb: 2 }}>
            We sent a password reset link to <strong>{email}</strong>. Click the link in the email
            to set a new password.
          </Alert>
          <Link component={RouterLink} to="/login" variant="body2">
            Back to sign in
          </Link>
        </Paper>
      </Box>
    )
  }

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Forgot password
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1 }}>
        Enter your email and we&apos;ll send you a link to reset your password.
      </Typography>
      <Paper component="form" onSubmit={handleSubmit} sx={{ p: 3, mt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        <TextField
          label="Email"
          type="email"
          fullWidth
          required
          autoComplete="email"
          value={email}
          onChange={(event) =>
            setEmail(clampAndStripControlChars(event.target.value, MAX_EMAIL_LENGTH))
          }
          sx={{ mb: 2 }}
        />
        <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ mb: 2 }}>
          {loading ? 'Sending…' : 'Send reset link'}
        </Button>
        <Link component={RouterLink} to="/login" variant="body2">
          Back to sign in
        </Link>
      </Paper>
    </Box>
  )
}
