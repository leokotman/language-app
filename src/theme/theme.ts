import { createTheme, type ThemeOptions } from '@mui/material/styles'

const palette = {
  primary: {
    main: '#1976d2',
    light: '#42a5f5',
    dark: '#1565c0',
  },
  secondary: {
    main: '#9c27b0',
    light: '#ba68c8',
    dark: '#7b1fa2',
  },
  background: {
    default: '#fafafa',
    paper: '#ffffff',
  },
} as const

export const themeOptions: ThemeOptions = {
  palette,
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2rem', fontWeight: 600 },
    h2: { fontSize: '1.75rem', fontWeight: 600 },
    h3: { fontSize: '1.5rem', fontWeight: 600 },
  },
  shape: { borderRadius: 8 },
}

export const theme = createTheme(themeOptions)
