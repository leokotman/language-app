import { useState, useCallback } from 'react'
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Switch, Tooltip, Snackbar } from '@mui/material'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import LogoutIcon from '@mui/icons-material/Logout'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useThemeMode } from '@/theme/ThemeModeContext'
import { useAuth } from '@/hooks/useAuth'
import { useOfflineModeStore } from '@/stores/offlineModeStore'
import { syncForOffline } from '@/lib/offlineSync'
import { offlineLog } from '@/lib/offlineDebug'
import { userVocabularyListQueryKey } from '@/hooks/useVocabulary'
import { USER_LANGUAGES_QUERY_KEY } from '@/hooks/useUserLanguages'

const SNACKBAR_AUTO_HIDE_MS = 5000

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'My Library', path: '/library' },
  { label: 'Dictionary', path: '/dictionary' },
  { label: 'Study', path: '/study' },
  { label: 'Progress', path: '/progress' },
  { label: 'User Settings', path: '/settings' },
]

export function Navbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { mode, toggleMode } = useThemeMode()
  const { isAuthenticated, user, signOut } = useAuth()
  const offlineMode = useOfflineModeStore((state) => state.offlineMode)
  const setOfflineMode = useOfflineModeStore((state) => state.setOfflineMode)
  const [syncing, setSyncing] = useState(false)
  const [snackMessage, setSnackMessage] = useState<string | null>(null)

  const handleOfflineToggle = useCallback(
    async (_event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
      setOfflineMode(checked)
      if (checked && user?.id && typeof navigator !== 'undefined' && navigator.onLine) {
        offlineLog('Navbar Offline toggle ON → sync started', { userId: user.id })
        setSyncing(true)
        const result = await syncForOffline(user.id)
        setSyncing(false)
        if (result.success) {
          queryClient.invalidateQueries({ queryKey: ['vocabulary'] })
          queryClient.invalidateQueries({ queryKey: userVocabularyListQueryKey(user.id) })
          queryClient.invalidateQueries({ queryKey: [...USER_LANGUAGES_QUERY_KEY, user.id] })
          setSnackMessage('Ready for offline. You can disconnect now.')
        } else {
          setSnackMessage('Sync failed. Stay online and try again.')
        }
      }
    },
    [user, setOfflineMode, queryClient]
  )

  const handleSignOut = () => {
    signOut()
    navigate('/login', { replace: true })
  }

  return (
    <AppBar position="sticky">
      <Toolbar>
        <Typography variant="h6" component="span" sx={{ flexGrow: 1 }}>
          Language App
        </Typography>
        <IconButton color="inherit" onClick={toggleMode} aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
          {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
        </IconButton>
        <Tooltip
          title={
            offlineMode
              ? 'Offline mode on: no web search. Data is from cache.'
              : 'Turn ON while online to sync all data for offline use. (The app cannot disconnect your device’s internet — turn off Wi‑Fi or use DevTools to test offline.)'
          }
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }} component="span">
            <Typography variant="caption" sx={{ mr: 0.5, opacity: 0.9 }}>
              {syncing ? 'Syncing…' : 'Offline'}
            </Typography>
            <Switch
              size="small"
              color="default"
              checked={offlineMode}
              onChange={handleOfflineToggle}
              disabled={syncing}
              aria-label="Offline mode"
            />
          </Box>
        </Tooltip>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {navItems.map(({ label, path }) => (
            <Button
              key={path}
              color="inherit"
              component={RouterLink}
              to={path}
              variant={location.pathname === path ? 'outlined' : 'text'}
              size="small"
            >
              {label}
            </Button>
          ))}
          {isAuthenticated ? (
            <>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {user?.email}
              </Typography>
              <IconButton color="inherit" onClick={handleSignOut} aria-label="Sign out" size="small">
                <LogoutIcon />
              </IconButton>
            </>
          ) : (
            <>
              <Button color="inherit" component={RouterLink} to="/login" size="small">
                Log in
              </Button>
              <Button color="inherit" component={RouterLink} to="/signup" variant="outlined" size="small">
                Sign up
              </Button>
            </>
          )}
        </Box>
        <Snackbar
          open={!!snackMessage}
          autoHideDuration={SNACKBAR_AUTO_HIDE_MS}
          onClose={() => setSnackMessage(null)}
          message={snackMessage}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
      </Toolbar>
    </AppBar>
  )
}
