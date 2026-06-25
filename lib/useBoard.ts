import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";
import type { Card, CardWithMeta, Profile, Reaction } from "./types";

interface RawCard extends Card {
  reactions: Reaction[];
  replies: { count: number }[];
}

function shape(row: RawCard, members: Profile[]): CardWithMeta {
  const { reactions, replies, ...card } = row;
  return {
    ...card,
    author: members.find((m) => m.id === card.author_id) ?? null,
    reactions: reactions ?? [],
    reply_count: replies?.[0]?.count ?? 0,
  };
}

const SELECT = "*, reactions(*), replies(count)";

/**
 * Loads the space's cards (newest first) with reactions + reply counts and
 * keeps them live via Realtime (PRD §6). RLS scopes every channel event to the
 * caller's space, so we can subscribe broadly and trust the filter.
 */
export function useBoard(spaceId: string | null, members: Profile[]) {
  const [cards, setCards] = useState<CardWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const membersRef = useRef(members);
  membersRef.current = members;

  const load = useCallback(async () => {
    if (!spaceId) {
      setCards([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("cards")
      .select(SELECT)
      .eq("space_id", spaceId)
      .order("created_at", { ascending: false });
    if (error) {
      setError(error.message);
    } else {
      setError(null);
      setCards((data as unknown as RawCard[]).map((r) => shape(r, membersRef.current)));
    }
    setLoading(false);
  }, [spaceId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  useEffect(() => {
    if (!spaceId) return;

    let reloadTimer: ReturnType<typeof setTimeout> | null = null;
    const debouncedReload = () => {
      if (reloadTimer) clearTimeout(reloadTimer);
      reloadTimer = setTimeout(load, 250);
    };

    const channel = supabase
      .channel(`board:${spaceId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cards", filter: `space_id=eq.${spaceId}` },
        debouncedReload
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reactions" },
        debouncedReload
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "replies" },
        debouncedReload
      )
      .subscribe();

    return () => {
      if (reloadTimer) clearTimeout(reloadTimer);
      supabase.removeChannel(channel);
    };
  }, [spaceId, load]);

  return { cards, loading, error, reload: load };
}
