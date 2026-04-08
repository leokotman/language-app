import type { SxProps, Theme } from "@mui/material/styles";
import {
  FIGMA_COLORS,
  FIGMA_EFFECTS,
  FIGMA_RADIUS,
  FIGMA_SPACING,
} from "@/theme/figmaTokens";

export const dashboardCardSx: SxProps<Theme> = {
  height: "100%",
  borderRadius: `${FIGMA_RADIUS.lg}px`,
  borderColor: FIGMA_COLORS.borderSubtle,
  bgcolor: FIGMA_COLORS.homeStatisticsCardBackground,
  backgroundImage: `linear-gradient(140deg, ${FIGMA_COLORS.homeStatisticsCardBackground} 0%, ${FIGMA_COLORS.homeStatisticsCardBackgroundSoft} 100%)`,
  boxShadow: "0 8px 20px rgba(13, 18, 38, 0.08)",
};

export const dashboardCardContentSx: SxProps<Theme> = {
  p: FIGMA_SPACING.xs,
};

export const dashboardCardLabelSx: SxProps<Theme> = {
  color: "text.secondary",
  letterSpacing: 0.3,
  textTransform: "uppercase",
};

export const dashboardCardValueSx: SxProps<Theme> = {
  mt: 1,
  color: "text.primary",
  fontWeight: 600,
};

export const quickActionCardSx: SxProps<Theme> = {
  height: "100%",
  borderRadius: `${FIGMA_RADIUS.lg}px`,
  borderColor: FIGMA_COLORS.borderSubtle,
  bgcolor: FIGMA_COLORS.homeQuickActionsCardBackground,
  boxShadow: "0 8px 22px rgba(13, 18, 38, 0.07)",
  transition: "transform 160ms ease, box-shadow 160ms ease",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 14px 28px rgba(13, 18, 38, 0.13)",
  },
};

export const quickActionCardContentSx: SxProps<Theme> = {
  height: "100%",
  display: "flex",
  flexDirection: "column",
  gap: FIGMA_SPACING.xs,
  p: FIGMA_SPACING.xs,
};

export const quickActionTitleSx: SxProps<Theme> = {
  color: "text.primary",
  fontWeight: 600,
};

export const quickActionDescriptionSx: SxProps<Theme> = {
  mt: 0.5,
  color: "text.secondary",
};

export const quickActionButtonSx: SxProps<Theme> = {
  mt: "auto",
  alignSelf: "stretch",
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  borderRadius: `${FIGMA_RADIUS.md}px`,
  textTransform: "none",
  whiteSpace: "normal",
  overflowWrap: "anywhere",
  lineHeight: 1.2,
  bgcolor: FIGMA_COLORS.primaryBlue,
  boxShadow: FIGMA_EFFECTS.buttonInnerGlow,
  "&:hover": {
    bgcolor: FIGMA_COLORS.primaryDeepViolet,
  },
};