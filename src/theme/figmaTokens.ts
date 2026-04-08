/**
 * Figma Design Tokens — Language Learning App Reference
 *
 * Extracted from: https://www.figma.com/design/hGyT4xsbMvF4uXgcihtJ8M/Language-Learning-App--Community---Copy-?node-id=801-12009
 * Related Jira ticket: KAN-41 — Design Home page dashboard layout in Figma
 *
 * Usage: style direction only (colors, typography hierarchy, spacing rhythm,
 * border radius, shadow treatment). NOT pixel-perfect — adapt to MUI theme.
 *
 * Source frames analysed: Signup, Login, Onboarding 5-7, Splash Screen (Light Design canvas)
 */

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------

export const FIGMA_COLORS = {
  // --- Backgrounds ---
  backgroundBase: "#080E1E", // main dark navy — app shell
  backgroundDeep: "#000000", // pure black — lowest layer
  backgroundElevated: "#0C0C1D", // slightly raised surface
  backgroundCard: "#24262B", // card / sheet surface
  backgroundBlue: "#0E1348", // deep blue accent surface

  // --- Primary brand ---
  primaryDeepViolet: "#410FA3", // splash screen bg, CTA buttons — bold brand color
  primaryBlue: "#5B7BFE", // electric blue — main interactive / links / progress
  homeCardBlue: "rgb(91, 123, 254)", // direct Home layout blue-ish card color

  // --- Home layout surfaces (from Figma Home screen) ---
  homeQuickActionsCardBackground: "rgb(219, 246, 255)",
  homeStatisticsCardBackground: "rgb(255, 246, 235)",
  homeStatisticsCardBackgroundSoft: "rgb(255, 252, 248)",

  // --- Accent palette ---
  accentTeal: "#5BA890", // success / positive feedback
  accentPink: "#D6185D", // error / love / streak
  accentOrangeWarm: "#EA9950", // warm highlight
  accentOrangeVivid: "#F76400", // vivid call-to-action accent

  // --- Text ---
  textPrimary: "#FFFFFF", // white — primary content
  textSecondary: "#656872", // muted grey — secondary/placeholder
  textOnDark: "#FFFFFF",

  // --- Borders & dividers ---
  borderLight: "#D6D9DD", // light grey border (inputs on dark)
  borderMid: "#DADADA", // mid grey
  borderSubtle: "#E7E7E7", // very subtle hairline
  borderDark: "#363A43", // dark card border

  // --- Social auth ---
  socialFacebook: "#1877F2",
  socialFacebookLight: "#518EF8",
  socialGoogleYellow: "#FBBB00",
  socialGoogleGreen: "#28B446",
  socialGoogleRed: "#F14336",
} as const;

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------

/**
 * Reference font: Fredoka (rounded, playful — community template).
 * Our app uses Inter (MUI default). Map weights/sizes to Inter equivalents.
 */
export const FIGMA_TYPOGRAPHY = {
  fontFamilyReference: "Fredoka", // source reference
  fontFamilyApp: "Inter", // actual font used in the app

  /**
   * Scale (px) — use as guidance for MUI `theme.typography` sizing:
   *
   * | Role         | Size | Weight | LineHeight |
   * |--------------|------|--------|------------|
   * | display      |  36  |  600   |   42       |
   * | h3 / section |  22  |  500   |   28       |
   * | label / sub  |  17  |  500   |   22       |
   * | body         |  15  |  400   |   20       |
   * | button       |  20  |  500   |   24       |
   */
  scale: {
    display: { fontSize: 36, fontWeight: 600, lineHeight: 42, letterSpacing: 0 },
    sectionTitle: { fontSize: 22, fontWeight: 500, lineHeight: 28, letterSpacing: 0.22 },
    labelMedium: { fontSize: 17, fontWeight: 500, lineHeight: 22, letterSpacing: 0.17 },
    labelRegular: { fontSize: 17, fontWeight: 400, lineHeight: 22, letterSpacing: 0.17 },
    body: { fontSize: 15, fontWeight: 400, lineHeight: 20, letterSpacing: 0.15 },
    button: { fontSize: 20, fontWeight: 500, lineHeight: 24, letterSpacing: 0.2 },
  },
} as const;

// ---------------------------------------------------------------------------
// Spacing & Layout
// ---------------------------------------------------------------------------

/**
 * Raw values observed across Signup, Login, and Onboarding screens.
 * Use as input to MUI `theme.spacing` or inline styles.
 */
export const FIGMA_SPACING = {
  /** Gap between tightly packed inline items (e.g. icon + label) */
  xs: 5,
  /** Default gap between items in a list or form row */
  sm: 8,
  /** Medium gap — inner card content */
  md: 10,
  /** Default component padding / stack gap */
  base: 12,
  /** Standard section gap */
  lg: 15,
  /** Section padding / card inset */
  xl: 16,
  /** Screen horizontal padding */
  screenH: 20,
  /** Large section top/bottom padding */
  section: 40,
  /** Top safe-area / hero padding */
  hero: 63,
} as const;

// ---------------------------------------------------------------------------
// Border Radius
// ---------------------------------------------------------------------------

export const FIGMA_RADIUS = {
  /** Hairline — subtle indicator */
  hairline: 1.33,
  /** Tiny badge or chip */
  tiny: 2.67,
  /** Input fields, small cards */
  sm: 10,
  /** Buttons, input wrappers, modals */
  md: 12,
  /** Large cards, bottom sheets */
  lg: 16,
} as const;

// ---------------------------------------------------------------------------
// Shadows & Effects
// ---------------------------------------------------------------------------

export const FIGMA_EFFECTS = {
  /**
   * Button inner glow — applied on primary/CTA buttons.
   * Creates a top highlight simulating a slightly convex surface.
   * CSS: `box-shadow: inset 0px 4px 4px rgba(255, 255, 255, 0.20)`
   */
  buttonInnerGlow: "inset 0px 4px 4px rgba(255, 255, 255, 0.20)",

  /**
   * MUI `sx` helper for the button inner glow:
   * sx={{ boxShadow: FIGMA_EFFECTS.buttonInnerGlow }}
   */
} as const;

// ---------------------------------------------------------------------------
// Component Style Snapshots
// ---------------------------------------------------------------------------

/**
 * High-level style snapshots per component type, combining the tokens above.
 * These are REFERENCE values — adapt to MUI theme as needed.
 */
export const FIGMA_COMPONENT_STYLES = {
  /** Main app screen / page background */
  screen: {
    backgroundColor: FIGMA_COLORS.backgroundBase,
    paddingHorizontal: FIGMA_SPACING.screenH,
    paddingTop: FIGMA_SPACING.hero,
  },

  /** Card / sheet surface */
  card: {
    backgroundColor: FIGMA_COLORS.backgroundCard,
    borderRadius: FIGMA_RADIUS.lg,
    borderColor: FIGMA_COLORS.borderDark,
    padding: FIGMA_SPACING.base,
    gap: FIGMA_SPACING.sm,
  },

  /** Primary CTA button */
  buttonPrimary: {
    backgroundColor: FIGMA_COLORS.primaryBlue,
    borderRadius: FIGMA_RADIUS.md,
    padding: `${FIGMA_SPACING.sm}px ${FIGMA_SPACING.screenH}px`,
    boxShadow: FIGMA_EFFECTS.buttonInnerGlow,
    color: FIGMA_COLORS.textPrimary,
    fontSize: FIGMA_TYPOGRAPHY.scale.button.fontSize,
    fontWeight: FIGMA_TYPOGRAPHY.scale.button.fontWeight,
    lineHeight: `${FIGMA_TYPOGRAPHY.scale.button.lineHeight}px`,
  },

  /** Deep-brand button (e.g. splash, onboarding) */
  buttonBrand: {
    backgroundColor: FIGMA_COLORS.primaryDeepViolet,
    borderRadius: FIGMA_RADIUS.md,
    boxShadow: FIGMA_EFFECTS.buttonInnerGlow,
    color: FIGMA_COLORS.textPrimary,
    fontSize: FIGMA_TYPOGRAPHY.scale.button.fontSize,
    fontWeight: FIGMA_TYPOGRAPHY.scale.button.fontWeight,
  },

  /** Input field */
  inputField: {
    backgroundColor: FIGMA_COLORS.backgroundElevated,
    borderRadius: FIGMA_RADIUS.md,
    borderColor: FIGMA_COLORS.borderLight,
    borderWidth: 1,
    paddingHorizontal: FIGMA_SPACING.base,
    paddingVertical: FIGMA_SPACING.sm,
    fontSize: FIGMA_TYPOGRAPHY.scale.body.fontSize,
    fontWeight: FIGMA_TYPOGRAPHY.scale.body.fontWeight,
    color: FIGMA_COLORS.textPrimary,
    placeholderColor: FIGMA_COLORS.textSecondary,
  },

  /** Section / page title text */
  sectionTitle: {
    color: FIGMA_COLORS.textPrimary,
    fontSize: FIGMA_TYPOGRAPHY.scale.sectionTitle.fontSize,
    fontWeight: FIGMA_TYPOGRAPHY.scale.sectionTitle.fontWeight,
    lineHeight: `${FIGMA_TYPOGRAPHY.scale.sectionTitle.lineHeight}px`,
    letterSpacing: FIGMA_TYPOGRAPHY.scale.sectionTitle.letterSpacing,
  },

  /** Body text */
  bodyText: {
    color: FIGMA_COLORS.textPrimary,
    fontSize: FIGMA_TYPOGRAPHY.scale.body.fontSize,
    fontWeight: FIGMA_TYPOGRAPHY.scale.body.fontWeight,
    lineHeight: `${FIGMA_TYPOGRAPHY.scale.body.lineHeight}px`,
    letterSpacing: FIGMA_TYPOGRAPHY.scale.body.letterSpacing,
  },

  /** Secondary / muted text */
  bodyTextSecondary: {
    color: FIGMA_COLORS.textSecondary,
    fontSize: FIGMA_TYPOGRAPHY.scale.body.fontSize,
    fontWeight: FIGMA_TYPOGRAPHY.scale.body.fontWeight,
    lineHeight: `${FIGMA_TYPOGRAPHY.scale.body.lineHeight}px`,
  },

  /** Divider / horizontal rule */
  divider: {
    borderColor: FIGMA_COLORS.borderSubtle,
    borderWidth: 1,
    borderStyle: "solid" as const,
  },

  /** Navbar / bottom tab bar */
  navbar: {
    backgroundColor: FIGMA_COLORS.backgroundDeep,
    borderTopColor: FIGMA_COLORS.borderDark,
  },

  /** Splash / hero screen */
  splashScreen: {
    backgroundColor: FIGMA_COLORS.primaryDeepViolet,
    color: FIGMA_COLORS.textPrimary,
    fontSize: FIGMA_TYPOGRAPHY.scale.display.fontSize,
    fontWeight: FIGMA_TYPOGRAPHY.scale.display.fontWeight,
    lineHeight: `${FIGMA_TYPOGRAPHY.scale.display.lineHeight}px`,
  },

  /** Onboarding screen body */
  onboardingScreen: {
    backgroundColor: FIGMA_COLORS.backgroundBase,
    paddingHorizontal: FIGMA_SPACING.screenH,
    gap: FIGMA_SPACING.base,
  },

  /** Auth form container (Signup/Login) */
  authForm: {
    backgroundColor: FIGMA_COLORS.backgroundBase,
    paddingHorizontal: FIGMA_SPACING.screenH,
    gap: FIGMA_SPACING.lg,
  },

  /** Progress / stat indicator */
  progressIndicator: {
    color: FIGMA_COLORS.accentTeal,
    accentColor: FIGMA_COLORS.primaryBlue,
    fontSize: FIGMA_TYPOGRAPHY.scale.labelMedium.fontSize,
    fontWeight: FIGMA_TYPOGRAPHY.scale.labelMedium.fontWeight,
  },
} as const;
