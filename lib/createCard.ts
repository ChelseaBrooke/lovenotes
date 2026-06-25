import { supabase } from "./supabase";
import { uploadImage, uploadVideo } from "./media";
import { resolveLink } from "./resolveLink";
import type { Card, CardType } from "./types";
import type { PoemStyle } from "./poemStyles";

interface Base {
  spaceId: string;
  authorId: string;
}

async function insertCard(
  row: Partial<Card> & { space_id: string; author_id: string; type: CardType }
): Promise<Card> {
  const { data, error } = await supabase.from("cards").insert(row).select("*").single();
  if (error) throw error;
  return data as Card;
}

/** Poem or quote. The words are the body; quote optionally carries an attribution. */
export async function addTextCard(
  base: Base,
  params: { type: "poem" | "quote"; body: string; title?: string; style?: PoemStyle }
): Promise<Card> {
  return insertCard({
    space_id: base.spaceId,
    author_id: base.authorId,
    type: params.type,
    body: params.body.trim(),
    title: params.title?.trim() || null,
    style: params.type === "poem" ? params.style ?? null : null,
  });
}

/** A link/TikTok. Inserts immediately, then enriches with oEmbed metadata. */
export async function addLinkCard(
  base: Base,
  params: { url: string; note?: string }
): Promise<Card> {
  const card = await insertCard({
    space_id: base.spaceId,
    author_id: base.authorId,
    type: "link",
    url: params.url.trim(),
    note: params.note?.trim() || null,
  });

  // Fire-and-forget enrichment (PRD §10) — the card renders plainly until this
  // lands, then updates live via Realtime.
  resolveLink(params.url)
    .then((meta) =>
      supabase
        .from("cards")
        .update({
          link_provider: meta.provider,
          link_title: meta.title,
          link_author: meta.author,
          link_thumbnail_url: meta.thumbnail_url,
        })
        .eq("id", card.id)
    )
    .catch(() => {});

  return card;
}

/** An image or screenshot from the photo library. Compresses then uploads. */
export async function addImageCard(
  base: Base,
  params: { uri: string; note?: string; isScreenshot?: boolean }
): Promise<Card> {
  const card = await insertCard({
    space_id: base.spaceId,
    author_id: base.authorId,
    type: params.isScreenshot ? "screenshot" : "image",
    note: params.note?.trim() || null,
  });

  const { path, width, height } = await uploadImage({
    uri: params.uri,
    spaceId: base.spaceId,
    cardId: card.id,
  });

  const { data, error } = await supabase
    .from("cards")
    .update({ media_path: path, media_width: width, media_height: height })
    .eq("id", card.id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Card;
}

/** An own-video. Uploaded as-is (the one heavy-media path). */
export async function addVideoCard(
  base: Base,
  params: { uri: string; note?: string; width?: number; height?: number; ext?: string }
): Promise<Card> {
  const card = await insertCard({
    space_id: base.spaceId,
    author_id: base.authorId,
    type: "video",
    note: params.note?.trim() || null,
    media_width: params.width ?? null,
    media_height: params.height ?? null,
  });

  const { path } = await uploadVideo({
    uri: params.uri,
    spaceId: base.spaceId,
    cardId: card.id,
    ext: params.ext,
  });

  const { data, error } = await supabase
    .from("cards")
    .update({ media_path: path })
    .eq("id", card.id)
    .select("*")
    .single();
  if (error) throw error;
  return data as Card;
}
