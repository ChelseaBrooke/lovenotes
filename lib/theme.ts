/**
 * Design tokens for lovenotes.
 *
 * Two themes mapped over the same token shape: a light "paper" theme (default)
 * and a dark "candlelit" theme. Select on system color scheme with a manual
 * override (see ThemeProvider). The accent is terracotta; serif is reserved for
 * the words, sans for the chrome (see fonts below).
 */

export type ThemeName = "light" | "dark";

export interface Theme {
  name: ThemeName;
  // Grounds & surfaces
  paper: string;
  surface: string;
  surfacePlain: string;
  hairline: string;
  hairlineStrong: string;
  // Ink / text
  ink: string;
  inkSoft: string;
  textSecondary: string;
  textMuted: string;
  // Accent
  accent: string;
  accentDeep: string;
  accentSoft: string;
  // Blush (quote cards)
  blushBg: string;
  blushBorder: string;
  blushAccent: string;
  blushInk: string;
  blushInkSoft: string;
}

export const light: Theme = {
  name: "light",
  paper: "#FBF7F1",
  surface: "#FFFDF9",
  surfacePlain: "#FFFFFF",
  hairline: "#ECE1D2",
  hairlineStrong: "#E5DACB",
  ink: "#34251A",
  inkSoft: "#3A2A1C",
  textSecondary: "#8C7E6C",
  textMuted: "#9A8C79",
  accent: "#C2502E",
  accentDeep: "#993C1D",
  accentSoft: "#E8896B",
  blushBg: "#FBEAF0",
  blushBorder: "#F1CFDB",
  blushAccent: "#D4537E",
  blushInk: "#4B1528",
  blushInkSoft: "#993556",
};

export const dark: Theme = {
  name: "dark",
  paper: "#1E1813",
  surface: "#2A211B",
  surfacePlain: "#2A211B",
  hairline: "#3A2E25",
  hairlineStrong: "#3A2E25",
  ink: "#F0E6DA",
  inkSoft: "#F0E6DA",
  textSecondary: "#B5A492",
  textMuted: "#9C8C79",
  accent: "#E8896B",
  accentDeep: "#C2502E",
  accentSoft: "#E8896B",
  blushBg: "#3A2630",
  blushBorder: "#4A2E3A",
  blushAccent: "#E89BB4",
  blushInk: "#F0C9D6",
  blushInkSoft: "#E89BB4",
};

export const themes: Record<ThemeName, Theme> = { light, dark };

/** Font family names. Keep in sync with the useFonts() map in app/_layout.tsx. */
export const fonts = {
  serif: "Fraunces_400Regular",
  serifMedium: "Fraunces_500Medium",
  serifSemiBold: "Fraunces_600SemiBold",
  serifItalic: "Fraunces_400Regular_Italic",
  sans: "Inter_400Regular",
  sansMedium: "Inter_500Medium",
  sansSemiBold: "Inter_600SemiBold",
} as const;

/** Shared shape & spacing constants from the design system. */
export const radius = {
  card: 16,
  sheet: 22,
  pill: 14,
} as const;

export const hairlineWidth = 0.5;
