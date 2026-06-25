import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/ThemeProvider";
import { fonts, hairlineWidth, radius } from "@/lib/theme";
import type { CardWithMeta } from "@/lib/types";
import { Authorship } from "../Authorship";

export function QuoteCard({ card }: { card: CardWithMeta }) {
  const t = useTheme();
  const loved = card.reactions.length > 0;
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: t.blushBg, borderColor: t.blushBorder, borderRadius: radius.card },
      ]}
    >
      <Text style={[styles.mark, { color: t.blushAccent }]}>“</Text>
      {!!card.body && (
        <Text style={[styles.body, { color: t.blushInk }]}>{card.body}</Text>
      )}
      {!!card.title && (
        <Text style={[styles.attribution, { color: t.blushInkSoft }]}>
          — {card.title}
        </Text>
      )}
      <Authorship author={card.author} createdAt={card.created_at} loved={loved} blush />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 14, paddingTop: 6, borderWidth: hairlineWidth },
  mark: { fontFamily: fonts.serifSemiBold, fontSize: 40, height: 34, marginBottom: 2 },
  body: { fontFamily: fonts.serif, fontSize: 14.5, lineHeight: 14.5 * 1.6 },
  attribution: { fontFamily: fonts.sansMedium, fontSize: 12, marginTop: 8 },
});
