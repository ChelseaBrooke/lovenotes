import React from "react";
import { StyleSheet, Text } from "react-native";
import { useTheme } from "@/lib/ThemeProvider";
import { fonts } from "@/lib/theme";

/** Small uppercase, letter-spaced, accent-colored type label (e.g. "poem"). */
export function Eyebrow({ children, color }: { children: string; color?: string }) {
  const t = useTheme();
  return (
    <Text style={[styles.eyebrow, { color: color ?? t.accent }]}>
      {children.toUpperCase()}
    </Text>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
});
