import { useState } from 'react'
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom'
import { Box, TextField, Button, Typography, Link, Alert, Paper } from '@mui/material'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/authStore'
import { getAuthErrorMessage } from '@/lib/errors'
import {
  sanitizeEmail,
  sanitizePassword,
  clampAndStripControlChars,
  MAX_EMAIL_LENGTH,
  MAX_PASSWORD_LENGTH,
} from '@/lib/sanitize'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const safeEmail = sanitizeEmail(email)
    const safePassword = sanitizePassword(password)
    setLoading(true)
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email: safeEmail,
        password: safePassword,
      })
      if (err) {
        setError(getAuthErrorMessage(err))
        return
      }
      // Update store immediately so ProtectedRoute sees the session when we navigate
      if (data?.session) {
        useAuthStore.getState().setAuth(data.session.user, data.session)
      }
      navigate(from, { replace: true })
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Sign in
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
          onChange={(e) => setEmail(clampAndStripControlChars(e.target.value, MAX_EMAIL_LENGTH))}
          sx={{ mb: 2 }}
        />
        <TextField
          label="Password"
          type="password"
          fullWidth
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(clampAndStripControlChars(e.target.value, MAX_PASSWORD_LENGTH))}
          sx={{ mb: 2 }}
        />
        <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ mb: 2 }}>
          {loading ? 'Signing in…' : 'Sign in'}
        </Button>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Link component={RouterLink} to="/forgot-password" variant="body2">
            Forgot password?
          </Link>
          <Link component={RouterLink} to="/signup" variant="body2">
            Don&apos;t have an account? Sign up
          </Link>
        </Box>
      </Paper>
    </Box>
  )
}
