import React, { useState } from "react";
import { Alert, Pressable, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check, X } from "lucide-react-native";
import { useTheme, useThemeControls } from "@/lib/ThemeProvider";
import { fonts, hairlineWidth, radius } from "@/lib/theme";
import { useAuth } from "@/lib/AuthProvider";
import { PrimaryButton } from "@/components/ui";

const THEME_OPTIONS = [
  { key: "system", label: "Match phone" },
  { key: "light", label: "Paper (light)" },
  { key: "dark", label: "Candlelit (dark)" },
] as const;

export default function Settings() {
  const t = useTheme();
  const { override, setOverride } = useThemeControls();
  const { profile, partner, space, setDisplayName, leaveSpace } = useAuth();
  const [name, setName] = useState(profile?.display_name ?? "");

  const saveName = async () => {
    const next = name.trim();
    if (next && next !== profile?.display_name) {
      try {
        await setDisplayName(next);
      } catch {
        /* ignore — offline / quota */
      }
    }
  };

  const confirmLeave = () => {
    Alert.alert(
      "Leave this space?",
      "You’ll need an invite code to pair again. Your notes stay for your partner.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            await leaveSpace();
            router.replace("/");
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.paper }]}>
      <View style={styles.head}>
        <Text style={[styles.title, { color: t.inkSoft }]}>settings</Text>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <X size={24} color={t.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <Section title="YOUR SPACE" theme={t}>
          <View style={styles.row}>
            <TextInput
              value={name}
              onChangeText={setName}
              onBlur={saveName}
              placeholder="Your name"
              placeholderTextColor={t.textMuted}
              autoCapitalize="words"
              style={[styles.rowLabel, styles.nameInput, { color: t.ink }]}
            />
            <Text style={[styles.rowSub, { color: t.textMuted }]}>you</Text>
          </View>
          {partner ? (
            <Row label={partner.display_name ?? "Partner"} sub="paired" theme={t} />
          ) : (
            <View style={styles.invite}>
              <Text style={[styles.inviteText, { color: t.textSecondary }]}>
                Waiting for your partner. Share the code:
              </Text>
              <View style={[styles.codeChip, { backgroundColor: t.surface, borderColor: t.hairlineStrong }]}>
                <Text style={[styles.code, { color: t.accent }]}>{space?.invite_code}</Text>
              </View>
              <Pressable
                onPress={() =>
                  Share.share({
                    message: `Join me on lovenotes — our code is ${space?.invite_code}`,
                  })
                }
              >
                <Text style={[styles.shareLink, { color: t.accent }]}>Share code</Text>
              </Pressable>
            </View>
          )}
        </Section>

        <Section title="APPEARANCE" theme={t}>
          {THEME_OPTIONS.map((opt) => {
            const active = override === opt.key;
            return (
              <Pressable key={opt.key} style={styles.row} onPress={() => setOverride(opt.key)}>
                <Text style={[styles.rowLabel, { color: t.ink }]}>{opt.label}</Text>
                {active && <Check size={18} color={t.accent} />}
              </Pressable>
            );
          })}
        </Section>

        <View style={{ flex: 1 }} />
        <PrimaryButton label="Leave space" onPress={confirmLeave} />
      </View>
    </SafeAreaView>
  );
}

function Section({
  title,
  theme,
  children,
}: {
  title: string;
  theme: any;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: 4 }}>
      <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{title}</Text>
      <View
        style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.hairline }]}
      >
        {children}
      </View>
    </View>
  );
}

function Row({
  label,
  sub,
  theme,
}: {
  label: string;
  sub?: string;
  theme: any;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: theme.ink }]}>{label}</Text>
      {!!sub && <Text style={[styles.rowSub, { color: theme.textMuted }]}>{sub}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: { fontFamily: fonts.serifItalic, fontSize: 22 },
  body: { flex: 1, padding: 20, gap: 24 },
  sectionTitle: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 0.6,
    marginLeft: 4,
  },
  card: { borderWidth: hairlineWidth, borderRadius: radius.card, paddingHorizontal: 16 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
  },
  rowLabel: { fontFamily: fonts.sans, fontSize: 16 },
  nameInput: { flex: 1, paddingVertical: 0 },
  rowSub: { fontFamily: fonts.sans, fontSize: 13 },
  invite: { paddingVertical: 16, gap: 10, alignItems: "center" },
  inviteText: { fontFamily: fonts.sans, fontSize: 13.5, textAlign: "center" },
  codeChip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 22,
    paddingVertical: 10,
  },
  code: { fontFamily: fonts.sansSemiBold, fontSize: 24, letterSpacing: 6 },
  shareLink: { fontFamily: fonts.sansMedium, fontSize: 14 },
});
