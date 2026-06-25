// resolve-link (PRD §10) — one server-side place to turn a URL into preview
// metadata, used by the share extension (M2) where direct oEmbed from the
// extension process is less reliable. The in-app add path resolves client-side
// (see lib/resolveLink.ts); point both at this function once deployed:
//
//   supabase functions deploy resolve-link --no-verify-jwt
//
// Input:  { "url": string }
// Output: { provider, title, author, thumbnail_url }

interface LinkMeta {
  provider: "tiktok" | "youtube" | "instagram" | "web";
  title: string | null;
  author: string | null;
  thumbnail_url: string | null;
}

function detectProvider(url: string): LinkMeta["provider"] {
  let host = "";
  try {
    host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "web";
  }
  if (host.includes("tiktok.com")) return "tiktok";
  if (host.includes("youtube.com") || host.includes("youtu.be")) return "youtube";
  if (host.includes("instagram.com")) return "instagram";
  return "web";
}

async function oembed(endpoint: string): Promise<Partial<LinkMeta>> {
  try {
    const res = await fetch(endpoint, { headers: { Accept: "application/json" } });
    if (!res.ok) return {};
    const d = await res.json();
    return { title: d.title ?? null, author: d.author_name ?? null, thumbnail_url: d.thumbnail_url ?? null };
  } catch {
    return {};
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  const { url } = await req.json().catch(() => ({ url: null }));
  if (!url || typeof url !== "string") {
    return new Response(JSON.stringify({ error: "Missing url" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const provider = detectProvider(url);
  let meta: Partial<LinkMeta> = {};
  if (provider === "tiktok") {
    meta = await oembed(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
  } else if (provider === "youtube") {
    meta = await oembed(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`);
  }

  const body: LinkMeta = {
    provider,
    title: meta.title ?? null,
    author: meta.author ?? null,
    thumbnail_url: meta.thumbnail_url ?? null,
  };
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
  });
});
