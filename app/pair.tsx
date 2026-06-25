import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/lib/ThemeProvider";
import { fonts, radius } from "@/lib/theme";
import { useAuth } from "@/lib/AuthProvider";
import { Field, GhostButton, PrimaryButton, Wordmark } from "@/components/ui";

type Step = "choose" | "join" | "created";

export default function Pair() {
  const t = useTheme();
  const { createSpace, joinSpace, setDisplayName, profile } = useAuth();
  const [step, setStep] = useState<Step>("choose");
  const [name, setName] = useState(
    profile?.display_name && profile.display_name !== "partner" ? profile.display_name : ""
  );
  const [code, setCode] = useState("");
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const saveName = async () => {
    if (name.trim()) await setDisplayName(name);
  };

  const start = async () => {
    if (!name.trim()) {
      Alert.alert("Your name?", "Add your name so your partner sees who pinned what.");
      return;
    }
    setBusy(true);
    try {
      await saveName();
      const space = await createSpace();
      setInviteCode(space.invite_code ?? "");
      setStep("created");
    } catch (e: any) {
      Alert.alert("Hmm", e?.message ?? "Could not create your space.");
    } finally {
      setBusy(false);
    }
  };

  const join = async () => {
    if (!name.trim()) {
      Alert.alert("Your name?", "Add your name so your partner sees who pinned what.");
      return;
    }
    if (code.trim().length < 4) {
      Alert.alert("Check the code", "Invite codes are 6 characters.");
      return;
    }
    setBusy(true);
    try {
      await saveName();
      await joinSpace(code);
      router.replace("/board");
    } catch (e: any) {
      Alert.alert("Couldn’t join", e?.message ?? "That code didn’t work.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.paper }]}>
      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Wordmark size={30} />
        </View>

        {step === "choose" && (
          <View style={styles.block}>
            <Text style={[styles.h1, { color: t.inkSoft }]}>Just the two of you</Text>
            <Text style={[styles.sub, { color: t.textSecondary }]}>
              Start a private board, then share the code with your person. Or
              join the one they already made.
            </Text>
            <Field
              label="YOUR NAME"
              value={name}
              onChangeText={setName}
              placeholder="e.g. Chelsea"
              autoCapitalize="words"
            />
            <View style={{ height: 4 }} />
            <PrimaryButton label="Start a space" onPress={start} loading={busy} />
            <GhostButton label="I have an invite code" onPress={() => setStep("join")} />
          </View>
        )}

        {step === "join" && (
          <View style={styles.block}>
            <Text style={[styles.h1, { color: t.inkSoft }]}>Enter the code</Text>
            <Text style={[styles.sub, { color: t.textSecondary }]}>
              The 6-character code your partner shared.
            </Text>
            <Field
              label="YOUR NAME"
              value={name}
              onChangeText={setName}
              placeholder="e.g. Jay"
              autoCapitalize="words"
            />
            <Field
              value={code}
              onChangeText={(v) => setCode(v.toUpperCase())}
              placeholder="ABC123"
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={6}
              style={styles.codeInput}
            />
            <PrimaryButton label="Join space" onPress={join} loading={busy} />
            <GhostButton label="Back" onPress={() => setStep("choose")} />
          </View>
        )}

        {step === "created" && (
          <View style={styles.block}>
            <Text style={[styles.h1, { color: t.inkSoft }]}>Your space is ready</Text>
            <Text style={[styles.sub, { color: t.textSecondary }]}>
              Share this code with your partner so they can join.
            </Text>
            <View
              style={[
                styles.codeChip,
                { backgroundColor: t.surface, borderColor: t.hairlineStrong },
              ]}
            >
              <Text style={[styles.code, { color: t.accent }]}>{inviteCode}</Text>
            </View>
            <PrimaryButton
              label="Share code"
              onPress={() =>
                Share.share({ message: `Join me on lovenotes — our code is ${inviteCode}` })
              }
            />
            <GhostButton label="Continue to our board" onPress={() => router.replace("/board")} />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: { flex: 1, justifyContent: "center", padding: 28 },
  header: { alignItems: "center", marginBottom: 36 },
  block: { gap: 14 },
  h1: { fontFamily: fonts.serifSemiBold, fontSize: 26, textAlign: "center" },
  sub: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    paddingHorizontal: 6,
    marginBottom: 4,
  },
  codeInput: { textAlign: "center", letterSpacing: 8, fontFamily: fonts.sansSemiBold, fontSize: 22 },
  codeChip: {
    alignSelf: "center",
    borderWidth: 1,
    borderRadius: radius.card,
    paddingHorizontal: 28,
    paddingVertical: 18,
    marginVertical: 6,
  },
  code: { fontFamily: fonts.sansSemiBold, fontSize: 34, letterSpacing: 10 },
});
