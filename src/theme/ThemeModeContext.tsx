import {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { PaletteMode } from '@mui/material/styles'
import {
  getStoredThemeMode,
  setStoredThemeMode,
  getTheme,
} from '@/theme/theme'
import { ThemeProvider } from '@mui/material/styles'

const ThemeModeContext = createContext<{
  mode: PaletteMode
  toggleMode: () => void
} | null>(null)

export function useThemeMode() {
  const ctx = useContext(ThemeModeContext)
  if (!ctx) throw new Error('useThemeMode must be used within ThemeModeProvider')
  return ctx
}

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<PaletteMode>(getStoredThemeMode)

  const toggleMode = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light'
      setStoredThemeMode(next)
      return next
    })
  }, [])

  const theme = useMemo(() => getTheme(mode), [mode])
  const value = useMemo(() => ({ mode, toggleMode }), [mode, toggleMode])

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeModeContext.Provider>
  )
}
