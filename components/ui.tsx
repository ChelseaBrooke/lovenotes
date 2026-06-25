import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";
import { useTheme } from "@/lib/ThemeProvider";
import { fonts, radius } from "@/lib/theme";

export function Wordmark({ size = 21 }: { size?: number }) {
  const t = useTheme();
  return (
    <Text style={{ fontFamily: fonts.serifItalic, fontSize: size, color: t.inkSoft }}>
      lovenotes
    </Text>
  );
}

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const t = useTheme();
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: pressed ? t.accentDeep : t.accent,
          opacity: off ? 0.55 : 1,
          borderRadius: radius.pill,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.btnText}>{label}</Text>
      )}
    </Pressable>
  );
}

export function GhostButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
      <Text style={[styles.ghost, { color: t.accent }]}>{label}</Text>
    </Pressable>
  );
}

export function Field(props: TextInputProps & { label?: string }) {
  const t = useTheme();
  const { label, style, ...rest } = props;
  return (
    <View style={{ gap: 6 }}>
      {!!label && <Text style={[styles.label, { color: t.textSecondary }]}>{label}</Text>}
      <TextInput
        placeholderTextColor={t.textMuted}
        {...rest}
        style={[
          styles.input,
          {
            backgroundColor: t.surface,
            borderColor: t.hairlineStrong,
            color: t.ink,
            borderRadius: radius.pill,
          },
          style,
        ]}
      />
    </View>
  );
}

export function FullLoader() {
  const t = useTheme();
  return (
    <View style={[styles.center, { backgroundColor: t.paper }]}>
      <ActivityIndicator color={t.accent} />
    </View>
  );
}

export function ConnectionError({
  message,
  onRetry,
}: {
  message?: string | null;
  onRetry: () => void;
}) {
  const t = useTheme();
  const quotaBlocked = !!message && /egress|restricted|quota/i.test(message);
  return (
    <View style={[styles.center, { backgroundColor: t.paper, padding: 32 }]}>
      <Wordmark size={26} />
      <Text style={[styles.errorTitle, { color: t.inkSoft }]}>can’t reach lovenotes</Text>
      <Text style={[styles.errorBody, { color: t.textMuted }]}>
        {quotaBlocked
          ? "Your Supabase project is paused by its usage quota. Restore service in the Supabase dashboard (upgrade plan or remove the spend cap), then retry."
          : message ?? "Check your connection and try again."}
      </Text>
      <View style={{ height: 8 }} />
      <PrimaryButton label="Try again" onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  btnText: { color: "#fff", fontFamily: fonts.sansSemiBold, fontSize: 15 },
  ghost: { fontFamily: fonts.sansMedium, fontSize: 14, textAlign: "center" },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    letterSpacing: 0.3,
    marginLeft: 2,
  },
  input: {
    height: 52,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontFamily: fonts.sans,
    fontSize: 16,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorTitle: { fontFamily: fonts.serif, fontSize: 22, marginTop: 18, textAlign: "center" },
  errorBody: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 10,
    marginBottom: 18,
  },
});
