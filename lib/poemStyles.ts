/**
 * Poem styling presets — the "stationery drawer" for love notes.
 *
 * A poem's look is stored on the card as a small JSON blob of preset *ids*
 * (paper / font / ink / frame). Storing ids (not raw colors) keeps the data
 * tiny and lets us re-tune the palette later without touching old cards.
 * Everything resolves through `resolvePoemStyle`, which always returns a safe,
 * fully-populated style even for unknown/missing ids.
 */

export interface PoemStyle {
  paper: string;
  font: string;
  ink: string;
  frame: string;
  /** Surface treatment drawn over the paper color (lines, grid, papyrus…). */
  texture: string;
  /** Font-size multiplier on top of the typeface's own scale (see SIZE_RANGE). */
  size: number;
}

export const SIZE_RANGE = { min: 0.8, max: 1.7, step: 0.05 } as const;

export interface PaperPreset {
  id: string;
  label: string;
  bg: string;
  /** True for dark stock — drives default ink + frame line color. */
  dark?: boolean;
}

export interface FontPreset {
  id: string;
  label: string;
  /** Loaded family name for the body. Keep in sync with app/_layout.tsx. */
  body: string;
  /** Family for the title / attribution line. */
  title: string;
  /** Size multiplier relative to the base poem size. */
  scale: number;
  /** Line-height multiplier. */
  line: number;
}

export interface InkPreset {
  id: string;
  label: string;
  color: string;
  /** True for light inks meant for dark paper. */
  light?: boolean;
}

export interface FramePreset {
  id: string;
  label: string;
}

export const PAPERS: PaperPreset[] = [
  { id: "cream", label: "Cream", bg: "#FBF7F1" },
  { id: "ivory", label: "Ivory", bg: "#FCFAF4" },
  { id: "blush", label: "Blush", bg: "#FBEAF0" },
  { id: "rose", label: "Rose", bg: "#F8DEE6" },
  { id: "sky", label: "Sky", bg: "#EAF1FB" },
  { id: "sage", label: "Sage", bg: "#EAF2E8" },
  { id: "lavender", label: "Lavender", bg: "#F1ECFA" },
  { id: "buttercup", label: "Buttercup", bg: "#FBF3D6" },
  { id: "parchment", label: "Parchment", bg: "#F0E6CE" },
  { id: "kraft", label: "Kraft", bg: "#E2CFAE" },
  { id: "charcoal", label: "Charcoal", bg: "#2A2521", dark: true },
  { id: "midnight", label: "Midnight", bg: "#192238", dark: true },
  { id: "noir", label: "Noir", bg: "#15110E", dark: true },
];

export const POEM_FONTS: FontPreset[] = [
  {
    id: "classic",
    label: "Classic",
    body: "Fraunces_400Regular",
    title: "Fraunces_600SemiBold",
    scale: 1,
    line: 1.65,
  },
  {
    id: "elegant",
    label: "Elegant",
    body: "PlayfairDisplay_500Medium",
    title: "PlayfairDisplay_600SemiBold",
    scale: 1.04,
    line: 1.6,
  },
  {
    id: "literary",
    label: "Literary",
    body: "CormorantGaramond_500Medium",
    title: "CormorantGaramond_600SemiBold",
    scale: 1.2,
    line: 1.48,
  },
  {
    id: "script",
    label: "Script",
    body: "DancingScript_500Medium",
    title: "DancingScript_700Bold",
    scale: 1.26,
    line: 1.5,
  },
  {
    id: "hand",
    label: "Handwritten",
    body: "Caveat_400Regular",
    title: "Caveat_600SemiBold",
    scale: 1.46,
    line: 1.38,
  },
  {
    id: "typewriter",
    label: "Typewriter",
    body: "SpecialElite_400Regular",
    title: "SpecialElite_400Regular",
    scale: 0.96,
    line: 1.7,
  },
  {
    id: "modern",
    label: "Modern",
    body: "Inter_400Regular",
    title: "Inter_600SemiBold",
    scale: 0.97,
    line: 1.6,
  },
];

export const INKS: InkPreset[] = [
  { id: "espresso", label: "Espresso", color: "#34251A" },
  { id: "noir", label: "Noir", color: "#1C1A17" },
  { id: "navy", label: "Navy", color: "#1E2A44" },
  { id: "wine", label: "Wine", color: "#5E1F30" },
  { id: "forest", label: "Forest", color: "#21402F" },
  { id: "plum", label: "Plum", color: "#3F2350" },
  { id: "terracotta", label: "Terracotta", color: "#9E3C1C" },
  { id: "gold", label: "Antique gold", color: "#876613" },
  { id: "slate", label: "Slate", color: "#44505C" },
  { id: "cream", label: "Cream", color: "#F1E7D8", light: true },
  { id: "rosewater", label: "Rosewater", color: "#F0C9D6", light: true },
  { id: "honey", label: "Honey", color: "#E8C879", light: true },
];

export const FRAMES: FramePreset[] = [
  { id: "none", label: "None" },
  { id: "line", label: "Hairline" },
  { id: "torn", label: "Torn" },
  { id: "tape", label: "Taped" },
  { id: "double", label: "Double" },
  { id: "dashed", label: "Dashed" },
  { id: "rounded", label: "Rounded" },
  { id: "shadow", label: "Floating" },
  { id: "corners", label: "Corners" },
];

export interface TexturePreset {
  id: string;
  label: string;
}

export const TEXTURES: TexturePreset[] = [
  { id: "plain", label: "Smooth" },
  { id: "lined", label: "Lined" },
  { id: "ruled", label: "Ruled + margin" },
  { id: "grid", label: "Grid" },
  { id: "dots", label: "Dot grid" },
  { id: "parchment", label: "Parchment" },
  { id: "papyrus", label: "Papyrus" },
];

export const DEFAULT_POEM_STYLE: PoemStyle = {
  paper: "cream",
  font: "classic",
  ink: "espresso",
  frame: "line",
  texture: "plain",
  size: 1,
};

export interface ResolvedPoemStyle {
  bg: string;
  isDark: boolean;
  ink: string;
  /** Muted ink, for eyebrow labels / dividers. */
  muted: string;
  /** Frame line color tuned to the paper. */
  line: string;
  bodyFont: string;
  titleFont: string;
  scale: number;
  lineMul: number;
  frame: string;
  texture: string;
}

function clampSize(n: number | undefined): number {
  if (typeof n !== "number" || Number.isNaN(n)) return 1;
  return Math.min(SIZE_RANGE.max, Math.max(SIZE_RANGE.min, n));
}

const byId = <T extends { id: string }>(list: T[], id: string | undefined) =>
  list.find((x) => x.id === id);

/** Accepts a stored style (possibly partial / unknown ids) and fills the gaps. */
export function resolvePoemStyle(style?: Partial<PoemStyle> | null): ResolvedPoemStyle {
  const paper = byId(PAPERS, style?.paper) ?? PAPERS[0];
  const font = byId(POEM_FONTS, style?.font) ?? POEM_FONTS[0];
  const isDark = !!paper.dark;

  // Pick an ink that reads on the paper: if the user chose a dark ink for dark
  // paper (or vice versa), fall back to a sensible default for that stock.
  let ink = byId(INKS, style?.ink);
  if (!ink) ink = isDark ? byId(INKS, "cream")! : INKS[0];
  if (isDark && !ink.light) ink = byId(INKS, "cream")!;
  if (!isDark && ink.light) ink = INKS[0];

  return {
    bg: paper.bg,
    isDark,
    ink: ink.color,
    muted: isDark ? "rgba(255,255,255,0.55)" : "rgba(40,28,18,0.5)",
    line: isDark ? "rgba(255,255,255,0.24)" : "rgba(52,37,26,0.22)",
    bodyFont: font.body,
    titleFont: font.title,
    scale: font.scale * clampSize(style?.size),
    lineMul: font.line,
    frame: byId(FRAMES, style?.frame)?.id ?? "line",
    texture: byId(TEXTURES, style?.texture)?.id ?? "plain",
  };
}
