/**
 * Resolve a URL into preview metadata for a link card.
 *
 * PRD §10 specifies a Supabase Edge Function `resolve-link` so the app *and*
 * the share extension share one reliable, CORS-free resolver. React Native's
 * fetch has no CORS, so the in-app add path can hit oEmbed directly; this keeps
 * v1 working without deploying the function. When the share extension lands,
 * point both targets at the deployed Edge Function instead.
 */

export interface LinkMeta {
  provider: "tiktok" | "youtube" | "instagram" | "web";
  title: string | null;
  author: string | null;
  thumbnail_url: string | null;
}

function detectProvider(url: string): LinkMeta["provider"] {
  const host = (() => {
    try {
      return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    } catch {
      return "";
    }
  })();
  if (host.includes("tiktok.com")) return "tiktok";
  if (host.includes("youtube.com") || host.includes("youtu.be")) return "youtube";
  if (host.includes("instagram.com")) return "instagram";
  return "web";
}

async function fetchOEmbed(endpoint: string): Promise<Partial<LinkMeta> | null> {
  try {
    const res = await fetch(endpoint, { headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data: any = await res.json();
    return {
      title: data.title ?? null,
      author: data.author_name ?? null,
      thumbnail_url: data.thumbnail_url ?? null,
    };
  } catch {
    return null;
  }
}

export async function resolveLink(url: string): Promise<LinkMeta> {
  const provider = detectProvider(url);
  const base: LinkMeta = { provider, title: null, author: null, thumbnail_url: null };

  let meta: Partial<LinkMeta> | null = null;
  if (provider === "tiktok") {
    meta = await fetchOEmbed(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
  } else if (provider === "youtube") {
    meta = await fetchOEmbed(
      `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`
    );
  }
  // Instagram and unknown hosts have no open oEmbed; fall back to a plain
  // link treatment (the card renders a Link glyph instead of a thumbnail).

  return { ...base, ...(meta ?? {}) };
}

export function looksLikeUrl(text: string): boolean {
  const t = text.trim();
  return /^(https?:\/\/|www\.)\S+$/i.test(t) || /^\S+\.\S{2,}\/\S*/.test(t);
}
