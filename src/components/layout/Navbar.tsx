import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material'
import { Link as RouterLink, useLocation } from 'react-router-dom'

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'My Library', path: '/library' },
  { label: 'Study', path: '/study' },
  { label: 'Progress', path: '/progress' },
  { label: 'User Settings', path: '/settings' },
]

export function Navbar() {
  const location = useLocation()

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="span" sx={{ flexGrow: 1 }}>
          Language App
        </Typography>
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
