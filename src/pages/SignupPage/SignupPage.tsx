import { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { Box, TextField, Button, Typography, Link, Alert, Paper } from '@mui/material'
import { supabase } from '@/lib/supabase'
import { upsertProfile } from '@/api/profiles'
import { getAuthErrorMessage, logError } from '@/lib/errors'
import {
  sanitizeEmail,
  sanitizePassword,
  clampAndStripControlChars,
  MIN_PASSWORD_LENGTH,
  MAX_EMAIL_LENGTH,
  MAX_PASSWORD_LENGTH,
} from '@/lib/sanitize'

export function SignupPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    const safeEmail = sanitizeEmail(email)
    const safePassword = sanitizePassword(password)
    if (safePassword !== sanitizePassword(confirmPassword)) {
      setError('Passwords do not match.')
      return
    }
    if (safePassword.length < MIN_PASSWORD_LENGTH) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: safeEmail,
        password: safePassword,
      })
      if (authError) {
        setError(getAuthErrorMessage(authError))
        return
      }
      if (data.user) {
        await upsertProfile({ id: data.user.id, email: data.user.email ?? undefined })
      }
      navigate('/', { replace: true })
    } catch (err) {
      logError('SignupPage.handleSubmit', err)
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Sign up
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
        <TextField
          label="Password"
          type="password"
          fullWidth
          required
          autoComplete="new-password"
          value={password}
          onChange={(event) =>
            setPassword(clampAndStripControlChars(event.target.value, MAX_PASSWORD_LENGTH))
          }
          helperText="At least 6 characters"
          sx={{ mb: 2 }}
        />
        <TextField
          label="Confirm password"
          type="password"
          fullWidth
          required
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) =>
            setConfirmPassword(
              clampAndStripControlChars(event.target.value, MAX_PASSWORD_LENGTH)
            )
          }
          sx={{ mb: 2 }}
        />
        <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ mb: 2 }}>
          {loading ? 'Creating account…' : 'Sign up'}
        </Button>
        <Link component={RouterLink} to="/login" variant="body2">
          Already have an account? Sign in
        </Link>
      </Paper>
    </Box>
  )
}
