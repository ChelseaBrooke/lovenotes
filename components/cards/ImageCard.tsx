import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/lib/ThemeProvider";
import { fonts, hairlineWidth, radius } from "@/lib/theme";
import type { CardWithMeta } from "@/lib/types";
import { Authorship } from "../Authorship";
import { MediaImage } from "../MediaImage";

export function ImageCard({ card }: { card: CardWithMeta }) {
  const t = useTheme();
  const loved = card.reactions.length > 0;
  const ratio =
    card.media_width && card.media_height
      ? card.media_width / card.media_height
      : 0.75;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: t.surfacePlain, borderColor: t.hairline, borderRadius: radius.card },
      ]}
    >
      {!!card.media_path && (
        <MediaImage
          path={card.media_path}
          style={[styles.image, { aspectRatio: ratio, borderRadius: radius.card - 4 }]}
        />
      )}
      <View style={styles.meta}>
        {!!card.note && (
          <Text style={[styles.note, { color: t.ink }]} numberOfLines={3}>
            {card.note}
          </Text>
        )}
        <Authorship author={card.author} createdAt={card.created_at} loved={loved} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 5, borderWidth: hairlineWidth, overflow: "hidden" },
  image: { width: "100%" },
  meta: { paddingHorizontal: 8, paddingTop: 6, paddingBottom: 4 },
  note: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, marginBottom: 2 },
});
