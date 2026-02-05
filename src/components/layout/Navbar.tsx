import { AppBar, Toolbar, Typography, Button, Box, IconButton } from '@mui/material'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import { useThemeMode } from '@/theme/ThemeModeContext'

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'My Library', path: '/library' },
  { label: 'Study', path: '/study' },
  { label: 'Progress', path: '/progress' },
  { label: 'User Settings', path: '/settings' },
]

export function Navbar() {
  const location = useLocation()
  const { mode, toggleMode } = useThemeMode()

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="span" sx={{ flexGrow: 1 }}>
          Language App
        </Typography>
        <IconButton color="inherit" onClick={toggleMode} aria-label={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
          {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
        </IconButton>
        <Box sx={{ display: 'flex', gap: 1 }}>
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
        </Box>
      </Toolbar>
    </AppBar>
  )
}
