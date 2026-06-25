import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChevronLeft,
  ExternalLink,
  Heart,
  Send,
  Trash2,
} from "lucide-react-native";
import { useTheme } from "@/lib/ThemeProvider";
import { fonts, hairlineWidth, radius } from "@/lib/theme";
import { useAuth } from "@/lib/AuthProvider";
import { useCard } from "@/lib/useCard";
import { supabase } from "@/lib/supabase";
import { warmTime } from "@/lib/time";
import type { Profile } from "@/lib/types";
import { MediaImage } from "@/components/MediaImage";
import { Eyebrow } from "@/components/cards/parts";
import { PoemPaper } from "@/components/cards/PoemPaper";
import { FullLoader } from "@/components/ui";

export default function CardDetail() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, profile, partner } = useAuth();
  const members = useMemo(
    () => [profile, partner].filter(Boolean) as Profile[],
    [profile, partner]
  );
  const { card, reactions, replies, loading, authorFor } = useCard(id!, members);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const myId = session?.user.id;
  const myReaction = reactions.find((r) => r.user_id === myId);
  const loved = !!myReaction;

  if (loading && !card) return <FullLoader />;
  if (!card) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: t.paper }]}>
        <Pressable style={styles.back} onPress={() => router.back()} hitSlop={10}>
          <ChevronLeft size={26} color={t.ink} />
        </Pressable>
        <View style={styles.center}>
          <Text style={{ fontFamily: fonts.serif, fontSize: 18, color: t.textMuted }}>
            this note is gone
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const author = authorFor(card.author_id);
  const isMine = card.author_id === myId;

  const toggleLove = async () => {
    if (!myId) return;
    if (loved) {
      await supabase.from("reactions").delete().eq("id", myReaction!.id);
    } else {
      await supabase.from("reactions").insert({ card_id: card.id, user_id: myId });
    }
  };

  const sendReply = async () => {
    if (!reply.trim() || !myId) return;
    setSending(true);
    const body = reply.trim();
    setReply("");
    const { error } = await supabase
      .from("replies")
      .insert({ card_id: card.id, author_id: myId, body });
    if (error) Alert.alert("Couldn’t send", error.message);
    setSending(false);
  };

  const remove = () => {
    Alert.alert("Remove this note?", "It will disappear from your board.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          await supabase.from("cards").delete().eq("id", card.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.paper }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <ChevronLeft size={26} color={t.ink} />
        </Pressable>
        {isMine && (
          <Pressable onPress={remove} hitSlop={10}>
            <Trash2 size={20} color={t.textMuted} />
          </Pressable>
        )}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={8}
      >
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {/* Content, given room to breathe (PRD §7.3). */}
          {card.type === "poem" && (
            <PoemPaper style={card.style} title={card.title} body={card.body} />
          )}

          {card.type === "quote" && (
            <View>
              <Eyebrow color={t.blushAccent}>{card.type}</Eyebrow>
              <Text style={[styles.serifBody, { color: t.blushInk }]}>{card.body}</Text>
              {!!card.title && (
                <Text style={[styles.attribution, { color: t.textSecondary }]}>
                  — {card.title}
                </Text>
              )}
            </View>
          )}

          {(card.type === "image" || card.type === "screenshot" || card.type === "video") &&
            !!card.media_path && (
              <MediaImage
                path={card.media_path}
                contentFit="contain"
                style={[styles.media, { borderColor: t.hairline }]}
              />
            )}

          {card.type === "link" && (
            <View>
              <View style={[styles.linkPreview, { borderColor: t.hairline }]}>
                {card.link_thumbnail_url ? (
                  <Image
                    source={{ uri: card.link_thumbnail_url }}
                    style={styles.linkThumb}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.linkThumb, styles.center, { backgroundColor: "#241c16" }]}>
                    <ExternalLink size={28} color={t.accentSoft} />
                  </View>
                )}
              </View>
              <Text style={[styles.linkTitle, { color: t.inkSoft }]}>
                {card.link_title || card.url}
              </Text>
              <Pressable
                style={[styles.openBtn, { backgroundColor: t.accent }]}
                onPress={() => card.url && Linking.openURL(card.url)}
              >
                <ExternalLink size={16} color="#fff" />
                <Text style={styles.openText}>Open {card.link_provider ?? "link"}</Text>
              </Pressable>
            </View>
          )}

          {!!card.note && card.type !== "poem" && card.type !== "quote" && (
            <Text style={[styles.note, { color: t.ink }]}>{card.note}</Text>
          )}

          {/* Footer authorship + reaction */}
          <View style={[styles.footer, { borderTopColor: t.hairline }]}>
            <Text style={[styles.pinned, { color: t.textMuted }]}>
              {author?.display_name ?? "someone"} pinned this {warmTime(card.created_at)}
            </Text>
            <Pressable onPress={toggleLove} style={styles.loveBtn} hitSlop={8}>
              <Heart
                size={22}
                color={t.accent}
                fill={loved ? t.accent : "transparent"}
                strokeWidth={2}
              />
              {reactions.length > 0 && (
                <Text style={[styles.loveCount, { color: t.accent }]}>{reactions.length}</Text>
              )}
            </Pressable>
          </View>

          {/* Replies */}
          <View style={styles.replies}>
            {replies.map((r) => {
              const ra = authorFor(r.author_id);
              const mine = r.author_id === myId;
              return (
                <View
                  key={r.id}
                  style={[
                    styles.reply,
                    {
                      backgroundColor: mine ? t.accentSoft : t.surface,
                      borderColor: t.hairline,
                      alignSelf: mine ? "flex-end" : "flex-start",
                    },
                  ]}
                >
                  <Text
                    style={[styles.replyName, { color: mine ? "#fff" : t.textSecondary }]}
                  >
                    {ra?.display_name ?? "someone"}
                  </Text>
                  <Text style={[styles.replyBody, { color: mine ? "#fff" : t.ink }]}>
                    {r.body}
                  </Text>
                </View>
              );
            })}
          </View>
        </ScrollView>

        <View style={[styles.composer, { borderTopColor: t.hairline, backgroundColor: t.paper }]}>
          <TextInput
            value={reply}
            onChangeText={setReply}
            placeholder="say something…"
            placeholderTextColor={t.textMuted}
            style={[styles.composerInput, { color: t.ink, backgroundColor: t.surface, borderColor: t.hairlineStrong }]}
            multiline
          />
          <Pressable
            onPress={sendReply}
            disabled={!reply.trim() || sending}
            style={[
              styles.sendBtn,
              { backgroundColor: t.accent, opacity: reply.trim() ? 1 : 0.5 },
            ]}
          >
            <Send size={18} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  back: { padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  body: { padding: 24, paddingTop: 8, gap: 18 },
  serifBody: { fontFamily: fonts.serif, fontSize: 22, lineHeight: 22 * 1.85 },
  attribution: { fontFamily: fonts.sansMedium, fontSize: 14, marginTop: 14 },
  media: {
    width: "100%",
    aspectRatio: 0.8,
    borderRadius: radius.card,
    borderWidth: hairlineWidth,
  },
  linkPreview: { borderRadius: radius.card, overflow: "hidden", borderWidth: hairlineWidth },
  linkThumb: { width: "100%", aspectRatio: 1, backgroundColor: "#241c16" },
  linkTitle: { fontFamily: fonts.serif, fontSize: 18, lineHeight: 26, marginTop: 14 },
  openBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: radius.pill,
    marginTop: 14,
  },
  openText: { color: "#fff", fontFamily: fonts.sansSemiBold, fontSize: 14 },
  note: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 24 },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: hairlineWidth,
    paddingTop: 16,
  },
  pinned: { fontFamily: fonts.sans, fontSize: 12.5, flexShrink: 1 },
  loveBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  loveCount: { fontFamily: fonts.sansSemiBold, fontSize: 14 },
  replies: { gap: 10 },
  reply: {
    maxWidth: "85%",
    borderWidth: hairlineWidth,
    borderRadius: radius.card,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  replyName: { fontFamily: fonts.sansMedium, fontSize: 11, marginBottom: 2 },
  replyBody: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 21 },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    padding: 14,
    borderTopWidth: hairlineWidth,
  },
  composerInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: hairlineWidth,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    fontFamily: fonts.sans,
    fontSize: 15,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
