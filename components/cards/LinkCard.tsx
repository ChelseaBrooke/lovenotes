import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Link as LinkIcon, Play } from "lucide-react-native";
import { useTheme } from "@/lib/ThemeProvider";
import { fonts, hairlineWidth, radius } from "@/lib/theme";
import type { CardWithMeta } from "@/lib/types";
import { Authorship } from "../Authorship";

const FILL = { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 } as const;

const PROVIDER_LABEL: Record<string, string> = {
  tiktok: "TikTok",
  youtube: "YouTube",
  instagram: "Instagram",
  web: "Link",
};

export function LinkCard({ card }: { card: CardWithMeta }) {
  const t = useTheme();
  const loved = card.reactions.length > 0;
  const provider = card.link_provider ?? "web";
  const isVideo = provider === "tiktok" || provider === "youtube";
  const hasThumb = !!card.link_thumbnail_url;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: t.surface, borderColor: t.hairline, borderRadius: radius.card },
      ]}
    >
      <View style={[styles.thumb, { borderRadius: radius.card - 4 }]}>
        {hasThumb ? (
          <Image
            source={{ uri: card.link_thumbnail_url! }}
            style={FILL}
            contentFit="cover"
            transition={250}
          />
        ) : (
          <View style={styles.fallback}>
            <LinkIcon size={26} color={t.accentSoft} />
          </View>
        )}
        {isVideo && (
          <View style={styles.playWrap} pointerEvents="none">
            <View style={styles.playBtn}>
              <Play size={18} color="#fff" fill="#fff" />
            </View>
          </View>
        )}
        <View style={styles.providerTag}>
          <Text style={styles.providerText}>{PROVIDER_LABEL[provider] ?? "Link"}</Text>
        </View>
      </View>

      <View style={styles.meta}>
        <Text style={[styles.title, { color: t.inkSoft }]} numberOfLines={2}>
          {card.note || card.link_title || card.link_author || card.url}
        </Text>
        <Authorship author={card.author} createdAt={card.created_at} loved={loved} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 5, borderWidth: hairlineWidth, overflow: "hidden" },
  thumb: {
    width: "100%",
    aspectRatio: 0.8,
    backgroundColor: "#241c16",
    overflow: "hidden",
  },
  fallback: { ...FILL, alignItems: "center", justifyContent: "center" },
  playWrap: { ...FILL, alignItems: "center", justifyContent: "center" },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  providerTag: {
    position: "absolute",
    left: 8,
    bottom: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  providerText: {
    color: "#fff",
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    letterSpacing: 0.3,
  },
  meta: { paddingHorizontal: 8, paddingTop: 8, paddingBottom: 4 },
  title: { fontFamily: fonts.sansMedium, fontSize: 13.5, lineHeight: 18 },
});
