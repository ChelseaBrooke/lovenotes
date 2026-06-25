import React from "react";
import type { CardWithMeta } from "@/lib/types";
import { resolvePoemStyle } from "@/lib/poemStyles";
import { Authorship } from "../Authorship";
import { PoemPaper } from "./PoemPaper";

export function PoemCard({ card }: { card: CardWithMeta }) {
  const loved = card.reactions.length > 0;
  const s = resolvePoemStyle(card.style);
  return (
    <PoemPaper style={card.style} title={card.title} body={card.body} compact>
      <Authorship
        author={card.author}
        createdAt={card.created_at}
        loved={loved}
        mutedColor={s.muted}
        accentColor={s.ink}
      />
    </PoemPaper>
  );
}
