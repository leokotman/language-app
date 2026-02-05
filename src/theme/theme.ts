import { createTheme, type ThemeOptions, type PaletteMode } from '@mui/material/styles'

const THEME_STORAGE_KEY = 'themeMode'

export function getStoredThemeMode(): PaletteMode {
  if (typeof window === 'undefined') return 'light'
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as PaletteMode | null
    return stored === 'dark' || stored === 'light' ? stored : 'light'
  } catch {
    return 'light'
  }
}

export function setStoredThemeMode(mode: PaletteMode): void {
  localStorage.setItem(THEME_STORAGE_KEY, mode)
}

const baseOptions: Omit<ThemeOptions, 'palette'> = {
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: '2rem', fontWeight: 600 },
    h2: { fontSize: '1.75rem', fontWeight: 600 },
    h3: { fontSize: '1.5rem', fontWeight: 600 },
  },
  shape: { borderRadius: 8 },
}

export function getTheme(mode: PaletteMode) {
  return createTheme({
    ...baseOptions,
    palette: {
      mode,
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
      ...(mode === 'light'
        ? {
            background: { default: '#fafafa', paper: '#ffffff' },
          }
        : {
            background: { default: '#121212', paper: '#1e1e1e' },
          }),
    },
  })
}

export const themeOptions: ThemeOptions = {
  ...baseOptions,
  palette: {
    mode: 'light',
    primary: { main: '#1976d2', light: '#42a5f5', dark: '#1565c0' },
    secondary: { main: '#9c27b0', light: '#ba68c8', dark: '#7b1fa2' },
    background: { default: '#fafafa', paper: '#ffffff' },
  },
}

export const theme = getTheme('light')
