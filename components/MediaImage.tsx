import React, { useEffect, useState } from "react";
import { Image } from "expo-image";
import type { ImageStyle, StyleProp } from "react-native";
import { getMediaUrl } from "@/lib/media";
import { useTheme } from "@/lib/ThemeProvider";

interface Props {
  path: string;
  style?: StyleProp<ImageStyle>;
  contentFit?: "cover" | "contain";
}

/** Resolves a private storage object to a signed URL and renders it. */
export function MediaImage({ path, style, contentFit = "cover" }: Props) {
  const t = useTheme();
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getMediaUrl(path).then((u) => {
      if (active) setUri(u);
    });
    return () => {
      active = false;
    };
  }, [path]);

  return (
    <Image
      source={uri ? { uri } : undefined}
      style={[{ backgroundColor: t.hairline }, style]}
      contentFit={contentFit}
      transition={250}
    />
  );
}
