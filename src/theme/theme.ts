import {
  createTheme,
  type ThemeOptions,
  type PaletteMode,
} from "@mui/material/styles";
import { logError } from "@/lib/errors";

const THEME_STORAGE_KEY = "themeMode";

const LIGHT_THEME_COLORS = {
  primary: { main: "#2B6EF2", light: "#5A8EF7", dark: "#1F56C1" },
  secondary: { main: "#2CB67D", light: "#55C995", dark: "#209162" },
  background: { default: "#F5F8FF", paper: "#FFFFFF" },
  text: { primary: "#16213D", secondary: "#5C6784" },
  divider: "#DCE5F7",
};

const DARK_THEME_COLORS = {
  primary: { main: "#79A6FF", light: "#A4C2FF", dark: "#5C8BE4" },
  secondary: { main: "#5AD1A1", light: "#7DDFC1", dark: "#3FAE82" },
  background: { default: "#0D1428", paper: "#121D36" },
  text: { primary: "#E6ECFF", secondary: "#A3B1D4" },
  divider: "#2A3554",
};

export function getStoredThemeMode(): PaletteMode {
  if (typeof window === "undefined") return "light";
  try {
    const stored = localStorage.getItem(
      THEME_STORAGE_KEY,
    ) as PaletteMode | null;
    return stored === "dark" || stored === "light" ? stored : "light";
  } catch (err) {
    logError("theme.getStoredThemeMode", err);
    return "light";
  }
}

export function setStoredThemeMode(mode: PaletteMode): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch (err) {
    logError("theme.setStoredThemeMode", err);
    // Theme still applied in memory; only persistence failed
  }
}

const baseOptions: Omit<ThemeOptions, "palette"> = {
  typography: {
    fontFamily:
      '"Manrope", "Nunito Sans", "Segoe UI", "Helvetica", "Arial", sans-serif',
    h1: { fontSize: "2.25rem", fontWeight: 700, lineHeight: 1.2 },
    h2: { fontSize: "1.875rem", fontWeight: 700, lineHeight: 1.25 },
    h3: { fontSize: "1.5rem", fontWeight: 700, lineHeight: 1.3 },
    h4: { fontSize: "1.25rem", fontWeight: 700, lineHeight: 1.35 },
    h5: { fontSize: "1.125rem", fontWeight: 700, lineHeight: 1.35 },
    h6: { fontSize: "1rem", fontWeight: 700, lineHeight: 1.4 },
    body1: { fontSize: "1rem", fontWeight: 500, lineHeight: 1.6 },
    body2: { fontSize: "0.9375rem", fontWeight: 500, lineHeight: 1.6 },
    button: {
      fontSize: "0.95rem",
      fontWeight: 700,
      textTransform: "none",
      letterSpacing: "0.01em",
    },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          border: "1px solid",
          boxShadow: "0 10px 30px rgba(16, 28, 61, 0.08)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 12,
          paddingInline: 16,
          paddingBlock: 10,
        },
      },
    },
  },
};

export function getTheme(mode: PaletteMode) {
  const colors = mode === "light" ? LIGHT_THEME_COLORS : DARK_THEME_COLORS;

  return createTheme({
    ...baseOptions,
    palette: {
      mode,
      primary: colors.primary,
      secondary: colors.secondary,
      background: colors.background,
      text: colors.text,
      divider: colors.divider,
    },
  });
}

export const themeOptions: ThemeOptions = {
  ...baseOptions,
  palette: {
    mode: "light",
    primary: LIGHT_THEME_COLORS.primary,
    secondary: LIGHT_THEME_COLORS.secondary,
    background: LIGHT_THEME_COLORS.background,
    text: LIGHT_THEME_COLORS.text,
    divider: LIGHT_THEME_COLORS.divider,
  },
};

export const theme = getTheme("light");
