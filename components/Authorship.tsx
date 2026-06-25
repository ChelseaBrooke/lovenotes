import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Heart } from "lucide-react-native";
import { useTheme } from "@/lib/ThemeProvider";
import { fonts } from "@/lib/theme";
import { warmTime } from "@/lib/time";
import type { Profile } from "@/lib/types";

interface Props {
  author?: Profile | null;
  createdAt: string;
  loved?: boolean;
  blush?: boolean;
  /** Override the muted text/heart color (e.g. to read on styled poem paper). */
  mutedColor?: string;
  /** Override the loved-heart accent color. */
  accentColor?: string;
}

/**
 * The ambient-authorship line (PRD §1): a small heart, who added it, and a
 * warm relative time. Appears everywhere a card appears.
 */
export function Authorship({ author, createdAt, loved, blush, mutedColor, accentColor }: Props) {
  const t = useTheme();
  const muted = mutedColor ?? (blush ? t.blushInkSoft : t.textMuted);
  const heartColor = accentColor ?? (blush ? t.blushAccent : t.accent);
  const name = author?.display_name ?? "someone";

  return (
    <View style={styles.row}>
      <Heart
        size={11}
        color={loved ? heartColor : muted}
        fill={loved ? heartColor : "transparent"}
        strokeWidth={2}
      />
      <Text
        accessibilityLabel={`pinned by ${name} ${warmTime(createdAt)}`}
        style={[styles.text, { color: muted }]}
        numberOfLines={1}
      >
        {name} · {warmTime(createdAt)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 },
  text: { fontFamily: fonts.sans, fontSize: 11.5, flexShrink: 1 },
});
