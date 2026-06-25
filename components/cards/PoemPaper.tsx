import React, { useId, useState } from "react";
import { LayoutChangeEvent, StyleSheet, Text, TextInput, View, ViewStyle } from "react-native";
import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  Line,
  Path,
  Pattern,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { radius } from "@/lib/theme";
import { PoemStyle, resolvePoemStyle } from "@/lib/poemStyles";

/**
 * Renders a poem on its chosen stationery: paper color, surface texture
 * (lined / grid / dots / parchment / papyrus), font, ink, and edge — including
 * a torn-paper silhouette and washi-tape corners drawn with SVG. Shared by the
 * board card (compact), the detail screen, and the editable compose surface.
 */

// Fixed pseudo-random offsets so a torn edge looks irregular but stable across
// re-renders (no jitter as the user types).
const SEED = [
  0.35, 0.72, 0.18, 0.83, 0.5, 0.92, 0.3, 0.66, 0.12, 0.88, 0.46, 0.6, 0.24, 0.78, 0.4, 0.55, 0.7,
  0.33, 0.62, 0.2, 0.87, 0.41,
];

function tornPath(w: number, h: number, amp: number): string {
  const steps = Math.max(8, Math.round(w / 16));
  let i = 0;
  const peek = () => SEED[i++ % SEED.length];
  const parts: string[] = [`M0 ${(peek() * amp).toFixed(1)}`];
  for (let s = 1; s <= steps; s++) {
    parts.push(`L${((w / steps) * s).toFixed(1)} ${(peek() * amp).toFixed(1)}`);
  }
  parts.push(`L${w.toFixed(1)} ${(h - amp + peek() * amp).toFixed(1)}`);
  for (let s = 1; s <= steps; s++) {
    parts.push(`L${(w - (w / steps) * s).toFixed(1)} ${(h - peek() * amp).toFixed(1)}`);
  }
  parts.push("Z");
  return parts.join(" ");
}

export function PoemPaper({
  style,
  title,
  body,
  compact = false,
  showEyebrow = true,
  editable = false,
  value,
  onChangeText,
  placeholder,
  autoFocus,
  children,
}: {
  style?: Partial<PoemStyle> | null;
  title?: string | null;
  body?: string | null;
  compact?: boolean;
  showEyebrow?: boolean;
  editable?: boolean;
  value?: string;
  onChangeText?: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  children?: React.ReactNode;
}) {
  const s = resolvePoemStyle(style);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (Math.abs(width - box.w) > 1 || Math.abs(height - box.h) > 1) {
      setBox({ w: width, h: height });
    }
  };

  const torn = s.frame === "torn";
  const amp = compact ? 5 : 8;
  const br = torn ? 0 : s.frame === "rounded" ? 26 : radius.card;
  const pad = compact ? 16 : 26;
  const padH = s.frame === "double" ? pad + 6 : pad;
  const padV = torn ? pad + amp + 2 : s.frame === "double" ? pad + 6 : pad;

  const baseSize = compact ? 15 : 21;
  const fontSize = baseSize * s.scale;
  const titleSize = (compact ? 16 : 22) * Math.max(1, s.scale * 0.92);
  const lineGap = compact ? 24 : 30;
  const gridGap = compact ? 22 : 26;
  const dotGap = compact ? 18 : 22;

  // Texture line color, tuned to the paper's lightness.
  const texLine =
    s.texture === "lined" || s.texture === "ruled"
      ? s.isDark
        ? "rgba(255,255,255,0.18)"
        : "rgba(40,70,130,0.16)"
      : s.isDark
      ? "rgba(255,255,255,0.16)"
      : "rgba(60,45,30,0.16)";
  const vigColor = s.texture === "papyrus" ? "#4A341A" : "#5C4326";
  const deckle = s.isDark ? "rgba(255,255,255,0.22)" : "rgba(86,60,33,0.32)";

  const tex = s.texture;
  const hasPattern =
    tex === "lined" || tex === "ruled" || tex === "grid" || tex === "dots" || tex === "papyrus";
  const hasVignette = tex === "parchment" || tex === "papyrus";

  const container: ViewStyle = {
    position: "relative",
    borderRadius: br,
    paddingVertical: padV,
    paddingHorizontal: padH,
    backgroundColor: torn ? "transparent" : s.bg,
  };
  if (s.frame === "line") Object.assign(container, { borderWidth: 1, borderColor: s.line });
  if (s.frame === "dashed")
    Object.assign(container, { borderWidth: 1.5, borderColor: s.line, borderStyle: "dashed" });
  if (s.frame === "rounded") Object.assign(container, { borderWidth: 2, borderColor: s.line });
  if (s.frame === "double") Object.assign(container, { borderWidth: 1, borderColor: s.line });
  if (s.frame === "shadow" || s.frame === "tape") {
    Object.assign(container, {
      shadowColor: "#2A1B10",
      shadowOpacity: s.isDark ? 0.4 : 0.18,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 7 },
      elevation: 5,
    });
  }

  const bodyStyle = {
    color: s.ink,
    fontFamily: s.bodyFont,
    fontSize,
    lineHeight: fontSize * s.lineMul,
  };

  return (
    <View style={container} onLayout={onLayout}>
      {box.w > 0 && (
        <Svg style={StyleSheet.absoluteFill} width={box.w} height={box.h}>
          <Defs>
            <ClipPath id={`c${uid}`}>
              {torn ? (
                <Path d={tornPath(box.w, box.h, amp)} />
              ) : (
                <Rect x={0} y={0} width={box.w} height={box.h} rx={br} ry={br} />
              )}
            </ClipPath>
            {(tex === "lined" || tex === "ruled") && (
              <Pattern id={`p${uid}`} patternUnits="userSpaceOnUse" width={8} height={lineGap}>
                <Line x1={0} y1={lineGap - 0.5} x2={8} y2={lineGap - 0.5} stroke={texLine} strokeWidth={1} />
              </Pattern>
            )}
            {tex === "grid" && (
              <Pattern id={`p${uid}`} patternUnits="userSpaceOnUse" width={gridGap} height={gridGap}>
                <Line x1={0} y1={gridGap - 0.5} x2={gridGap} y2={gridGap - 0.5} stroke={texLine} strokeWidth={0.8} />
                <Line x1={gridGap - 0.5} y1={0} x2={gridGap - 0.5} y2={gridGap} stroke={texLine} strokeWidth={0.8} />
              </Pattern>
            )}
            {tex === "dots" && (
              <Pattern id={`p${uid}`} patternUnits="userSpaceOnUse" width={dotGap} height={dotGap}>
                <Circle cx={dotGap / 2} cy={dotGap / 2} r={1.1} fill={texLine} />
              </Pattern>
            )}
            {tex === "papyrus" && (
              <Pattern id={`p${uid}`} patternUnits="userSpaceOnUse" width={7} height={9}>
                <Line x1={0} y1={4} x2={7} y2={4} stroke="rgba(120,85,40,0.10)" strokeWidth={2} />
                <Line x1={3} y1={0} x2={3} y2={9} stroke="rgba(120,85,40,0.06)" strokeWidth={2} />
              </Pattern>
            )}
            {hasVignette && (
              <RadialGradient id={`v${uid}`} cx="50%" cy="42%" rx="75%" ry="75%">
                <Stop offset="50%" stopColor={vigColor} stopOpacity={0} />
                <Stop offset="100%" stopColor={vigColor} stopOpacity={tex === "papyrus" ? 0.28 : 0.2} />
              </RadialGradient>
            )}
          </Defs>

          <G clipPath={`url(#c${uid})`}>
            <Rect x={0} y={0} width={box.w} height={box.h} fill={s.bg} />
            {hasPattern && <Rect x={0} y={0} width={box.w} height={box.h} fill={`url(#p${uid})`} />}
            {tex === "ruled" && (
              <Line x1={padH - 10} y1={0} x2={padH - 10} y2={box.h} stroke="rgba(200,80,80,0.45)" strokeWidth={1} />
            )}
            {hasVignette && <Rect x={0} y={0} width={box.w} height={box.h} fill={`url(#v${uid})`} />}
          </G>

          {torn && <Path d={tornPath(box.w, box.h, amp)} fill="none" stroke={deckle} strokeWidth={1} />}
        </Svg>
      )}

      {s.frame === "double" && (
        <View pointerEvents="none" style={[styles.inner, { borderColor: s.line }]} />
      )}
      {s.frame === "corners" && <Corners color={s.line} />}
      {s.frame === "tape" && (
        <>
          <View style={[styles.tape, styles.tapeLeft]} />
          <View style={[styles.tape, styles.tapeRight]} />
        </>
      )}

      {showEyebrow && <Text style={[styles.eyebrow, { color: s.muted }]}>POEM</Text>}
      {!!title && (
        <Text style={[styles.title, { color: s.ink, fontFamily: s.titleFont, fontSize: titleSize }]}>
          {title}
        </Text>
      )}

      {editable ? (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={s.muted}
          autoFocus={autoFocus}
          multiline
          style={[bodyStyle, styles.input]}
        />
      ) : (
        !!body && <Text style={bodyStyle}>{body}</Text>
      )}

      {children}
    </View>
  );
}

function Corners({ color }: { color: string }) {
  const len = 16;
  const w = 1.5;
  const base = { position: "absolute" as const, width: len, height: len, borderColor: color };
  return (
    <View pointerEvents="none" style={styles.cornerLayer}>
      <View style={[base, { top: 8, left: 8, borderTopWidth: w, borderLeftWidth: w }]} />
      <View style={[base, { top: 8, right: 8, borderTopWidth: w, borderRightWidth: w }]} />
      <View style={[base, { bottom: 8, left: 8, borderBottomWidth: w, borderLeftWidth: w }]} />
      <View style={[base, { bottom: 8, right: 8, borderBottomWidth: w, borderRightWidth: w }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  inner: {
    position: "absolute",
    top: 5,
    left: 5,
    right: 5,
    bottom: 5,
    borderWidth: 1,
    borderRadius: radius.card - 4,
  },
  cornerLayer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  tape: {
    position: "absolute",
    width: 58,
    height: 22,
    top: -9,
    backgroundColor: "rgba(214,196,150,0.55)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(120,100,60,0.35)",
  },
  tapeLeft: { left: 16, transform: [{ rotate: "-8deg" }] },
  tapeRight: { right: 16, transform: [{ rotate: "7deg" }] },
  eyebrow: { fontFamily: "Inter_500Medium", fontSize: 11, letterSpacing: 0.5, marginBottom: 6 },
  title: { marginBottom: 6 },
  input: { minHeight: 150, padding: 0, margin: 0, textAlignVertical: "top" },
});
