import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Slider from "@react-native-community/slider";
import * as ImagePicker from "expo-image-picker";
import { ChevronDown, ImagePlus, Link2, Quote, Type, X } from "lucide-react-native";
import { useTheme } from "@/lib/ThemeProvider";
import { fonts, hairlineWidth, radius } from "@/lib/theme";
import { useAuth } from "@/lib/AuthProvider";
import { looksLikeUrl } from "@/lib/resolveLink";
import { addImageCard, addLinkCard, addTextCard } from "@/lib/createCard";
import { PrimaryButton } from "@/components/ui";
import { PoemPaper } from "@/components/cards/PoemPaper";
import {
  DEFAULT_POEM_STYLE,
  FRAMES,
  INKS,
  PAPERS,
  POEM_FONTS,
  PoemStyle,
  SIZE_RANGE,
  TEXTURES,
} from "@/lib/poemStyles";

type TextKind = "poem" | "quote";
type StudioField = "paper" | "texture" | "font" | "ink" | "edge" | "size";

const FIELD_TITLES: Record<StudioField, string> = {
  paper: "Paper",
  texture: "Texture",
  font: "Typeface",
  ink: "Ink",
  edge: "Edge",
  size: "Size",
};

export default function Add() {
  const t = useTheme();
  const { profile, session } = useAuth();
  const [text, setText] = useState("");
  const [note, setNote] = useState("");
  const [attribution, setAttribution] = useState("");
  const [textKind, setTextKind] = useState<TextKind>("poem");
  const [poemStyle, setPoemStyle] = useState<PoemStyle>(DEFAULT_POEM_STYLE);
  const [field, setField] = useState<StudioField | null>(null);
  const [asset, setAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [busy, setBusy] = useState(false);

  const paperIsDark = !!PAPERS.find((p) => p.id === poemStyle.paper)?.dark;
  const inkChoices = INKS.filter((i) => !!i.light === paperIsDark);

  const pickPaper = (id: string) => {
    const dark = !!PAPERS.find((p) => p.id === id)?.dark;
    setPoemStyle((s) => {
      const inkOk = !!INKS.find((i) => i.id === s.ink)?.light === dark;
      return { ...s, paper: id, ink: inkOk ? s.ink : dark ? "cream" : "espresso" };
    });
  };

  const isUrl = useMemo(() => looksLikeUrl(text), [text]);
  const detected: "photo" | "link" | "text" | null = asset
    ? "photo"
    : isUrl
    ? "link"
    : text.trim()
    ? "text"
    : null;
  const composing = !asset && !isUrl; // writing a poem/quote (text, or still empty)
  const isPoem = composing && textKind === "poem";

  const curPaper = PAPERS.find((p) => p.id === poemStyle.paper) ?? PAPERS[0];
  const curFont = POEM_FONTS.find((f) => f.id === poemStyle.font) ?? POEM_FONTS[0];
  const curInk = INKS.find((i) => i.id === poemStyle.ink) ?? INKS[0];
  const curTexture = TEXTURES.find((tx) => tx.id === poemStyle.texture) ?? TEXTURES[0];
  const curFrame = FRAMES.find((fr) => fr.id === poemStyle.frame) ?? FRAMES[0];
  const sizeLabel = `${Math.round(poemStyle.size * 10) / 10}×`;
  const setStyle = (patch: Partial<PoemStyle>) => setPoemStyle((s) => ({ ...s, ...patch }));

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Photos access needed", "Allow photo access to pin an image.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
    });
    if (!res.canceled && res.assets[0]) setAsset(res.assets[0]);
  };

  const save = async () => {
    if (!profile?.space_id || !session) return;
    if (!detected) {
      Alert.alert("Nothing to pin yet", "Write something, paste a link, or add a photo.");
      return;
    }
    setBusy(true);
    const base = { spaceId: profile.space_id, authorId: session.user.id };
    try {
      if (detected === "photo" && asset) {
        await addImageCard(base, { uri: asset.uri, note });
      } else if (detected === "link") {
        await addLinkCard(base, { url: text, note });
      } else {
        await addTextCard(base, {
          type: textKind,
          body: text,
          title: textKind === "quote" ? attribution : undefined,
          style: textKind === "poem" ? poemStyle : undefined,
        });
      }
      router.back();
    } catch (e: any) {
      Alert.alert("Couldn’t pin that", e?.message ?? "Please try again.");
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: t.paper }]}>
      <View style={styles.head}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <X size={24} color={t.textSecondary} />
        </Pressable>
        <Text style={[styles.headTitle, { color: t.inkSoft }]}>pin a note</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {asset ? (
            <View style={styles.previewWrap}>
              <Image source={{ uri: asset.uri }} style={styles.preview} resizeMode="cover" />
              <Pressable
                style={[styles.removeImg, { backgroundColor: t.surface }]}
                onPress={() => setAsset(null)}
                hitSlop={8}
              >
                <X size={16} color={t.ink} />
              </Pressable>
            </View>
          ) : (
            <>
              {composing && (
                <View style={styles.segment}>
                  {(["poem", "quote"] as TextKind[]).map((k) => {
                    const active = textKind === k;
                    return (
                      <Pressable
                        key={k}
                        onPress={() => setTextKind(k)}
                        style={[
                          styles.segItem,
                          {
                            backgroundColor: active ? t.accent : t.surface,
                            borderColor: active ? t.accent : t.hairlineStrong,
                          },
                        ]}
                      >
                        {k === "poem" ? (
                          <Type size={15} color={active ? "#fff" : t.textSecondary} />
                        ) : (
                          <Quote size={15} color={active ? "#fff" : t.textSecondary} />
                        )}
                        <Text style={[styles.segText, { color: active ? "#fff" : t.textSecondary }]}>
                          {k}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}

              {isPoem && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.barScroll}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={[styles.bar, { backgroundColor: t.surface, borderColor: t.hairlineStrong }]}>
                    <Seg onPress={() => setField("font")}>
                      <Text style={{ fontFamily: curFont.title, fontSize: 15, color: t.ink }} numberOfLines={1}>
                        {curFont.label}
                      </Text>
                    </Seg>
                    <Divider />
                    <Seg onPress={() => setField("size")}>
                      <Text style={[styles.segVal, { color: t.ink }]}>{sizeLabel}</Text>
                    </Seg>
                    <Divider />
                    <Seg onPress={() => setField("ink")}>
                      <View style={[styles.segDot, { backgroundColor: curInk.color, borderColor: t.hairlineStrong }]} />
                    </Seg>
                  </View>

                  <View style={[styles.bar, { backgroundColor: t.surface, borderColor: t.hairlineStrong }]}>
                    <Seg onPress={() => setField("paper")}>
                      <View style={[styles.segSwatch, { backgroundColor: curPaper.bg, borderColor: t.hairlineStrong }]} />
                    </Seg>
                    <Divider />
                    <Seg onPress={() => setField("texture")}>
                      <Text style={[styles.segVal, { color: t.ink }]} numberOfLines={1}>
                        {curTexture.label}
                      </Text>
                    </Seg>
                    <Divider />
                    <Seg onPress={() => setField("edge")}>
                      <Text style={[styles.segVal, { color: t.ink }]} numberOfLines={1}>
                        {curFrame.label}
                      </Text>
                    </Seg>
                  </View>
                </ScrollView>
              )}

              {isPoem ? (
                <PoemPaper
                  style={poemStyle}
                  editable
                  value={text}
                  onChangeText={setText}
                  autoFocus
                  placeholder="write your poem…"
                />
              ) : (
                <TextInput
                  value={text}
                  onChangeText={setText}
                  placeholder="paste a link, or write something…"
                  placeholderTextColor={t.textMuted}
                  autoFocus
                  multiline
                  style={[
                    styles.mainInput,
                    { color: t.ink, backgroundColor: t.surface, borderColor: t.hairline },
                    detected === "text" && textKind === "quote" && { fontFamily: fonts.serif },
                  ]}
                />
              )}
            </>
          )}

          {composing && textKind === "quote" && (
            <TextInput
              value={attribution}
              onChangeText={setAttribution}
              placeholder="— who said it (optional)"
              placeholderTextColor={t.textMuted}
              style={[styles.note, { color: t.ink, backgroundColor: t.surface, borderColor: t.hairline }]}
            />
          )}

          {(detected === "photo" || detected === "link") && (
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="add a note (optional)"
              placeholderTextColor={t.textMuted}
              style={[styles.note, { color: t.ink, backgroundColor: t.surface, borderColor: t.hairline }]}
            />
          )}

          {!isPoem && (
            <View style={styles.tools}>
              <Pressable
                onPress={pickImage}
                style={[styles.tool, { backgroundColor: t.surface, borderColor: t.hairlineStrong }]}
              >
                <ImagePlus size={18} color={t.accent} />
                <Text style={[styles.toolText, { color: t.textSecondary }]}>Photo</Text>
              </Pressable>
              <View style={[styles.tool, { backgroundColor: t.surface, borderColor: t.hairlineStrong, opacity: 0.55 }]}>
                <Link2 size={18} color={t.textMuted} />
                <Text style={[styles.toolText, { color: t.textMuted }]}>Paste a link above</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton label="Pin it" onPress={save} loading={busy} disabled={!detected} />
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={field !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setField(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setField(null)}>
          <Pressable style={[styles.sheet, { backgroundColor: t.paper }]} onPress={() => {}}>
            <View style={[styles.sheetHandle, { backgroundColor: t.hairlineStrong }]} />
            <Text style={[styles.sheetTitle, { color: t.inkSoft }]}>
              {field ? FIELD_TITLES[field] : ""}
            </Text>
            <ScrollView contentContainerStyle={styles.sheetWrap} style={styles.sheetScroll}>
              {field === "size" && (
                <View style={styles.sheetSizeRow}>
                  <Text style={[styles.sizeMark, { color: t.textMuted, fontSize: 14 }]}>A</Text>
                  <Slider
                    style={styles.sheetSlider}
                    minimumValue={SIZE_RANGE.min}
                    maximumValue={SIZE_RANGE.max}
                    step={SIZE_RANGE.step}
                    value={poemStyle.size}
                    onValueChange={(v) => setStyle({ size: Math.round(v * 100) / 100 })}
                    minimumTrackTintColor={t.accent}
                    maximumTrackTintColor={t.hairlineStrong}
                    thumbTintColor={t.accent}
                  />
                  <Text style={[styles.sizeMark, { color: t.textMuted, fontSize: 26 }]}>A</Text>
                </View>
              )}

              {field === "paper" &&
                PAPERS.map((p) => {
                  const on = poemStyle.paper === p.id;
                  return (
                    <Pressable
                      key={p.id}
                      style={styles.sheetSwatchItem}
                      onPress={() => {
                        pickPaper(p.id);
                        setField(null);
                      }}
                    >
                      <View
                        style={[
                          styles.sheetSwatch,
                          { backgroundColor: p.bg, borderColor: on ? t.accent : t.hairlineStrong },
                          on && styles.sheetSelected,
                        ]}
                      />
                      <Text style={[styles.sheetItemLabel, { color: on ? t.accent : t.textSecondary }]} numberOfLines={1}>
                        {p.label}
                      </Text>
                    </Pressable>
                  );
                })}

              {field === "ink" &&
                inkChoices.map((i) => {
                  const on = poemStyle.ink === i.id;
                  return (
                    <Pressable
                      key={i.id}
                      style={styles.sheetSwatchItem}
                      onPress={() => {
                        setStyle({ ink: i.id });
                        setField(null);
                      }}
                    >
                      <View
                        style={[
                          styles.sheetDot,
                          { backgroundColor: i.color, borderColor: on ? t.accent : t.hairlineStrong },
                          on && styles.sheetSelected,
                        ]}
                      />
                      <Text style={[styles.sheetItemLabel, { color: on ? t.accent : t.textSecondary }]} numberOfLines={1}>
                        {i.label}
                      </Text>
                    </Pressable>
                  );
                })}

              {field === "font" &&
                POEM_FONTS.map((f) => {
                  const on = poemStyle.font === f.id;
                  return (
                    <Pressable
                      key={f.id}
                      onPress={() => {
                        setStyle({ font: f.id });
                        setField(null);
                      }}
                      style={[
                        styles.sheetChip,
                        { backgroundColor: on ? t.accent : t.surface, borderColor: on ? t.accent : t.hairlineStrong },
                      ]}
                    >
                      <Text style={{ fontFamily: f.title, fontSize: 17, color: on ? "#fff" : t.ink }}>
                        {f.label}
                      </Text>
                    </Pressable>
                  );
                })}

              {field === "texture" &&
                TEXTURES.map((tx) => {
                  const on = poemStyle.texture === tx.id;
                  return (
                    <Pressable
                      key={tx.id}
                      onPress={() => {
                        setStyle({ texture: tx.id });
                        setField(null);
                      }}
                      style={[
                        styles.sheetChip,
                        { backgroundColor: on ? t.accent : t.surface, borderColor: on ? t.accent : t.hairlineStrong },
                      ]}
                    >
                      <Text style={[styles.sheetChipText, { color: on ? "#fff" : t.textSecondary }]}>
                        {tx.label}
                      </Text>
                    </Pressable>
                  );
                })}

              {field === "edge" &&
                FRAMES.map((fr) => {
                  const on = poemStyle.frame === fr.id;
                  return (
                    <Pressable
                      key={fr.id}
                      onPress={() => {
                        setStyle({ frame: fr.id });
                        setField(null);
                      }}
                      style={[
                        styles.sheetChip,
                        { backgroundColor: on ? t.accent : t.surface, borderColor: on ? t.accent : t.hairlineStrong },
                      ]}
                    >
                      <Text style={[styles.sheetChipText, { color: on ? "#fff" : t.textSecondary }]}>
                        {fr.label}
                      </Text>
                    </Pressable>
                  );
                })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

/** One tappable segment inside a floating toolbar pill; opens a styling sheet. */
function Seg({ children, onPress }: { children: React.ReactNode; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} style={styles.seg}>
      {children}
      <ChevronDown size={13} color={t.textMuted} />
    </Pressable>
  );
}

/** Hairline divider between toolbar segments. */
function Divider() {
  const t = useTheme();
  return <View style={[styles.segDivider, { backgroundColor: t.hairlineStrong }]} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  headTitle: { fontFamily: fonts.serifItalic, fontSize: 18 },
  body: { padding: 18, gap: 14 },
  mainInput: {
    minHeight: 140,
    borderWidth: hairlineWidth,
    borderRadius: radius.card,
    padding: 16,
    fontFamily: fonts.sans,
    fontSize: 17,
    lineHeight: 25,
    textAlignVertical: "top",
  },
  previewWrap: { borderRadius: radius.card, overflow: "hidden" },
  preview: { width: "100%", height: 280, borderRadius: radius.card },
  removeImg: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  segment: { flexDirection: "row", gap: 10 },
  segItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 42,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  segText: { fontFamily: fonts.sansMedium, fontSize: 14, textTransform: "capitalize" },
  barScroll: { flexDirection: "row", gap: 10, paddingVertical: 4, paddingRight: 6 },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    height: 46,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 4,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  seg: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    height: 46,
  },
  segVal: { fontFamily: fonts.sansMedium, fontSize: 14 },
  segDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 1 },
  segSwatch: { width: 24, height: 17, borderRadius: 5, borderWidth: 1 },
  segDivider: { width: 1, height: 22, alignSelf: "center" },
  sheetSizeRow: { flexDirection: "row", alignItems: "center", gap: 8, width: "100%", paddingVertical: 4 },
  sheetSlider: { flex: 1, height: 36 },
  sizeMark: { fontFamily: fonts.serifSemiBold, textAlign: "center" },

  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 34,
  },
  sheetHandle: { alignSelf: "center", width: 40, height: 4, borderRadius: 2, marginBottom: 12 },
  sheetTitle: { fontFamily: fonts.serifSemiBold, fontSize: 18, marginBottom: 14 },
  sheetScroll: { maxHeight: 360 },
  sheetWrap: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingBottom: 4 },
  sheetSwatchItem: { width: 64, alignItems: "center", gap: 6 },
  sheetSwatch: { width: 60, height: 46, borderRadius: 10, borderWidth: 1.5 },
  sheetDot: { width: 46, height: 46, borderRadius: 23, borderWidth: 1.5 },
  sheetSelected: { borderWidth: 3 },
  sheetItemLabel: { fontFamily: fonts.sansMedium, fontSize: 11, textAlign: "center" },
  sheetChip: {
    paddingHorizontal: 16,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetChipText: { fontFamily: fonts.sansMedium, fontSize: 14 },
  note: {
    minHeight: 48,
    borderWidth: hairlineWidth,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.sans,
    fontSize: 15,
  },
  tools: { flexDirection: "row", gap: 10, marginTop: 2 },
  tool: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: hairlineWidth,
  },
  toolText: { fontFamily: fonts.sansMedium, fontSize: 13 },
  footer: { padding: 18, paddingBottom: 28 },
});
