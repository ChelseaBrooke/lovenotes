import React, { useMemo, useState } from "react";
import {
  ImageBackground,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Redirect, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Heart, Plus, Search, X } from "lucide-react-native";
import { useTheme } from "@/lib/ThemeProvider";
import { fonts, hairlineWidth, radius } from "@/lib/theme";
import { useAuth } from "@/lib/AuthProvider";
import { useBoard } from "@/lib/useBoard";
import type { Profile } from "@/lib/types";
import { Masonry } from "@/components/Masonry";
import { Wordmark, FullLoader } from "@/components/ui";

function Avatar({ profile, muted, theme }: { profile: Profile | null; muted?: boolean; theme: any }) {
  const initial = (profile?.display_name ?? "?").trim().charAt(0).toUpperCase();
  return (
    <View
      style={[
        styles.avatar,
        {
          backgroundColor: muted ? theme.hairline : theme.accentSoft,
          borderColor: theme.paper,
        },
      ]}
    >
      <Text style={[styles.avatarText, { color: muted ? theme.textMuted : "#fff" }]}>
        {initial}
      </Text>
    </View>
  );
}

export default function Board() {
  const t = useTheme();
  const { initializing, session, profile, partner } = useAuth();
  const members = useMemo(
    () => [profile, partner].filter(Boolean) as Profile[],
    [profile, partner]
  );
  const { cards, loading, error, reload } = useBoard(profile?.space_id ?? null, members);

  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter((c) =>
      [c.note, c.body, c.title, c.link_title, c.link_author, c.author?.display_name]
        .filter(Boolean)
        .some((f) => f!.toLowerCase().includes(q))
    );
  }, [cards, query]);

  if (initializing || !session) return <FullLoader />;
  if (!profile?.space_id) return <Redirect href="/pair" />;

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: "#C9A879" }]} edges={["top"]}>
      <ImageBackground source={require("../assets/cork.png")} style={styles.cork} resizeMode="cover">
      <View style={styles.header}>
        {searching ? (
          <View style={[styles.searchBar, { backgroundColor: t.surface, borderColor: t.hairlineStrong }]}>
            <Search size={16} color={t.textMuted} />
            <TextInput
              autoFocus
              value={query}
              onChangeText={setQuery}
              placeholder="search your notes"
              placeholderTextColor={t.textMuted}
              style={[styles.searchInput, { color: t.ink }]}
            />
            <Pressable
              onPress={() => {
                setSearching(false);
                setQuery("");
              }}
              hitSlop={10}
            >
              <X size={18} color={t.textMuted} />
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.brand}>
              <Wordmark size={22} />
              <Heart size={15} color={t.accent} fill={t.accent} strokeWidth={2} />
            </View>
            <View style={styles.headerRight}>
              <Pressable onPress={() => setSearching(true)} hitSlop={8} style={styles.iconBtn}>
                <Search size={20} color={t.textSecondary} />
              </Pressable>
              <Pressable onPress={() => router.push("/settings")} style={styles.avatars} hitSlop={8}>
                <Avatar profile={profile} theme={t} />
                <View style={{ marginLeft: -10 }}>
                  <Avatar profile={partner} muted={!partner} theme={t} />
                </View>
              </Pressable>
            </View>
          </>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.accent} />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading && cards.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptySub, { color: t.textMuted }]}>gathering your notes…</Text>
          </View>
        ) : error ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: t.inkSoft }]}>can’t reach your board</Text>
            <Text style={[styles.emptySub, { color: t.textMuted }]}>{error}</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={[styles.emptyTitle, { color: t.inkSoft }]}>
              {query ? "nothing matches" : "pin your first note"}
            </Text>
            {!query && (
              <Text style={[styles.emptySub, { color: t.textMuted }]}>
                a poem, a screenshot, a TikTok — tap + to begin.
              </Text>
            )}
          </View>
        ) : (
          <Masonry cards={filtered} onPressCard={(c) => router.push(`/card/${c.id}`)} />
        )}
      </ScrollView>

      <View style={styles.bottomBar} pointerEvents="box-none">
        <Pressable
          onPress={() => router.push("/add")}
          style={({ pressed }) => [
            styles.addBtn,
            { backgroundColor: pressed ? t.accentDeep : t.accent },
          ]}
        >
          <Plus size={26} color="#fff" strokeWidth={2.4} />
        </Pressable>
      </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  cork: { flex: 1 },
  brand: { flexDirection: "row", alignItems: "center", gap: 6 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 6,
    paddingBottom: 10,
    minHeight: 52,
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 14 },
  iconBtn: { padding: 2 },
  avatars: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontFamily: fonts.sansSemiBold, fontSize: 13 },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 40,
    borderWidth: hairlineWidth,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, fontFamily: fonts.sans, fontSize: 15 },
  scroll: { padding: 14, paddingBottom: 120 },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 140, gap: 8, paddingHorizontal: 40 },
  emptyTitle: { fontFamily: fonts.serif, fontSize: 20 },
  emptySub: { fontFamily: fonts.sans, fontSize: 14, textAlign: "center", lineHeight: 20 },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingBottom: 34,
  },
  addBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
});
