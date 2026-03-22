/** Semantic design tokens tuned to the Madhuban auth design system */

export const colors = {
  primary: "#155DFC",
  primaryMuted: "#1A2536",
  accent: "#155DFC",
  surface: "#F7F8FC",
  surfaceElevated: "#FFFFFF",
  text: "#1A2536",
  textMuted: "#62748E",
  border: "#DCE5F0",
  success: "#059669",
  warning: "#EA580C",
  danger: "#E7000B",
  authBlue: "#245EF5",
  authGreen: "#109F69",
  authGlowBlue: "rgba(36, 94, 245, 0.24)",
  authGlowGreen: "rgba(16, 159, 105, 0.24)",
  authGlowRed: "rgba(231, 0, 11, 0.24)",
  authBackgroundBlue: "rgba(36, 94, 245, 0.06)",
  authBackgroundPeach: "rgba(255, 123, 96, 0.08)",
  authVersion: "#98A8C4",
} as const;

export const radii = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  full: 9999,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const font = {
  family: {
    sans: "Montserrat_500Medium",
    medium: "Montserrat_500Medium",
    bold: "Montserrat_700Bold",
    black: "Montserrat_900Black",
  },
  size: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 20,
    xxl: 24,
  },
  weight: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "700" as const,
    bold: "900" as const,
  },
} as const;

export const typography = {
  authHeroTitle: {
    fontFamily: font.family.black,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.6,
  },
  authHeroSubtitle: {
    fontFamily: font.family.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
  },
  authCardTitle: {
    fontFamily: font.family.black,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.3,
  },
  authCardSubtitle: {
    fontFamily: font.family.medium,
    fontSize: 14,
    lineHeight: 24,
    letterSpacing: 0,
  },
  authFieldLabel: {
    fontFamily: font.family.bold,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1.2,
  },
  authInput: {
    fontFamily: font.family.medium,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0,
  },
  authButton: {
    fontFamily: font.family.bold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0,
  },
  authLink: {
    fontFamily: font.family.bold,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
  },
  authVersion: {
    fontFamily: font.family.bold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.4,
  },
} as const;

export type ThemeColors = typeof colors;
