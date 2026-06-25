import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import type { CardWithMeta } from "@/lib/types";
import { CardView } from "./CardView";

const GAP = 12;

/** Rough height estimate so the greedy two-column split stays balanced. */
function estimateHeight(card: CardWithMeta): number {
  switch (card.type) {
    case "poem":
      return 90 + (card.body?.length ?? 0) * 0.45 + (card.title ? 24 : 0);
    case "quote":
      return 110 + (card.body?.length ?? 0) * 0.5;
    case "link":
      return 230;
    case "image":
    case "screenshot":
    case "video": {
      const ratio =
        card.media_width && card.media_height
          ? card.media_width / card.media_height
          : 0.75;
      return 170 / Math.max(ratio, 0.4) + 60;
    }
    default:
      return 140;
  }
}

export function Masonry({
  cards,
  onPressCard,
}: {
  cards: CardWithMeta[];
  onPressCard: (card: CardWithMeta) => void;
}) {
  const columns = useMemo(() => {
    const cols: CardWithMeta[][] = [[], []];
    const heights = [0, 0];
    for (const card of cards) {
      const target = heights[0] <= heights[1] ? 0 : 1;
      cols[target].push(card);
      heights[target] += estimateHeight(card) + GAP;
    }
    return cols;
  }, [cards]);

  return (
    <View style={styles.row}>
      {columns.map((col, i) => (
        <View key={i} style={styles.col}>
          {col.map((card) => (
            <View key={card.id} style={styles.cardWrap}>
              <CardView card={card} onPress={() => onPressCard(card)} />
              <View style={styles.pin} pointerEvents="none">
                <View style={styles.pinDot}>
                  <View style={styles.pinHi} />
                </View>
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: GAP },
  col: { flex: 1 },
  cardWrap: { marginBottom: GAP, position: "relative" },
  pin: { position: "absolute", top: -7, left: 0, right: 0, alignItems: "center", zIndex: 5 },
  pinDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#C24E3A",
    borderWidth: 1,
    borderColor: "rgba(80,30,15,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  pinHi: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.55)",
    marginTop: -1,
    marginLeft: -1,
  },
});
