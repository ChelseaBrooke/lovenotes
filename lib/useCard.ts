import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { Card, Profile, Reaction, Reply } from "./types";

export interface CardDetail {
  card: Card | null;
  reactions: Reaction[];
  replies: Reply[];
}

export function useCard(cardId: string, members: Profile[]) {
  const [detail, setDetail] = useState<CardDetail>({
    card: null,
    reactions: [],
    replies: [],
  });
  const [loading, setLoading] = useState(true);

  const authorFor = useCallback(
    (id: string | undefined) => members.find((m) => m.id === id) ?? null,
    [members]
  );

  const load = useCallback(async () => {
    const [{ data: card }, { data: reactions }, { data: replies }] = await Promise.all([
      supabase.from("cards").select("*").eq("id", cardId).maybeSingle(),
      supabase.from("reactions").select("*").eq("card_id", cardId),
      supabase
        .from("replies")
        .select("*")
        .eq("card_id", cardId)
        .order("created_at", { ascending: true }),
    ]);
    setDetail({
      card: (card as Card) ?? null,
      reactions: reactions ?? [],
      replies: replies ?? [],
    });
    setLoading(false);
  }, [cardId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  useEffect(() => {
    const channel = supabase
      .channel(`card:${cardId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reactions", filter: `card_id=eq.${cardId}` },
        load
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "replies", filter: `card_id=eq.${cardId}` },
        load
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cards", filter: `id=eq.${cardId}` },
        load
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [cardId, load]);

  return { ...detail, loading, reload: load, authorFor };
}
