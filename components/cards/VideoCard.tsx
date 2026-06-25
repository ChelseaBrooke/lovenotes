import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Play } from "lucide-react-native";
import { useTheme } from "@/lib/ThemeProvider";
import { fonts, hairlineWidth, radius } from "@/lib/theme";
import type { CardWithMeta } from "@/lib/types";
import { Authorship } from "../Authorship";
import { MediaImage } from "../MediaImage";

const FILL = { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 } as const;

/** Own-video card: a poster frame with a play affordance (streams on detail). */
export function VideoCard({ card }: { card: CardWithMeta }) {
  const t = useTheme();
  const loved = card.reactions.length > 0;
  const ratio =
    card.media_width && card.media_height ? card.media_width / card.media_height : 0.75;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: t.surfacePlain, borderColor: t.hairline, borderRadius: radius.card },
      ]}
    >
      <View style={[styles.frame, { aspectRatio: ratio, borderRadius: radius.card - 4 }]}>
        {!!card.media_path && (
          <MediaImage path={card.media_path} style={FILL} />
        )}
        <View style={styles.playWrap} pointerEvents="none">
          <View style={styles.playBtn}>
            <Play size={20} color="#fff" fill="#fff" />
          </View>
        </View>
      </View>
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
  frame: { width: "100%", overflow: "hidden", backgroundColor: "#000" },
  playWrap: { ...FILL, alignItems: "center", justifyContent: "center" },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  meta: { paddingHorizontal: 8, paddingTop: 6, paddingBottom: 4 },
  note: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, marginBottom: 2 },
});
