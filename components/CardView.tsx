import React from "react";
import { Pressable } from "react-native";
import type { CardWithMeta } from "@/lib/types";
import { PoemCard } from "./cards/PoemCard";
import { QuoteCard } from "./cards/QuoteCard";
import { ImageCard } from "./cards/ImageCard";
import { VideoCard } from "./cards/VideoCard";
import { LinkCard } from "./cards/LinkCard";

/** Different content gets different soul (PRD §1) — dispatch by card type. */
export function CardView({
  card,
  onPress,
}: {
  card: CardWithMeta;
  onPress?: () => void;
}) {
  const body = (() => {
    switch (card.type) {
      case "poem":
        return <PoemCard card={card} />;
      case "quote":
        return <QuoteCard card={card} />;
      case "image":
      case "screenshot":
        return <ImageCard card={card} />;
      case "video":
        return <VideoCard card={card} />;
      case "link":
        return <LinkCard card={card} />;
      default:
        return <PoemCard card={card} />;
    }
  })();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      {body}
    </Pressable>
  );
}
