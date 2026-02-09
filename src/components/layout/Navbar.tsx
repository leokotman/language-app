import { AppBar, Toolbar, Typography, Button, Box, IconButton, Switch, Tooltip } from '@mui/material'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import LogoutIcon from '@mui/icons-material/Logout'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import { useThemeMode } from '@/theme/ThemeModeContext'
import { useAuth } from '@/hooks/useAuth'
import { useOfflineModeStore } from '@/stores/offlineModeStore'

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
  const { mode, toggleMode } = useThemeMode()
  const { isAuthenticated, user, signOut } = useAuth()
  const offlineMode = useOfflineModeStore((state) => state.offlineMode)
  const setOfflineMode = useOfflineModeStore((state) => state.setOfflineMode)

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
        <Tooltip title={offlineMode ? 'Offline mode: no internet search (dictionary, pronunciation)' : 'Use internet for dictionary and pronunciation'}>
          <Box sx={{ display: 'flex', alignItems: 'center' }} component="span">
            <Typography variant="caption" sx={{ mr: 0.5, opacity: 0.9 }}>Offline</Typography>
            <Switch
              size="small"
              color="default"
              checked={offlineMode}
              onChange={(_, checked) => setOfflineMode(checked)}
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
      </Toolbar>
    </AppBar>
  )
}
