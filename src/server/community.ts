import { getSecret } from "astro:env/server";
import { createServerClient } from "@supabase/ssr";
import type { AstroCookies } from "astro";

export const config = (name: string) => getSecret(`COMMUNITY_${name}`);

export function communityClient(cookies: AstroCookies, request: Request) {
  return communityFromHeader(cookies, request.headers.get("cookie") ?? "");
}

function communityFromHeader(cookies: AstroCookies, header: string) {
  const url = config("SUPABASE_URL");
  const key = config("SUPABASE_PUBLISHABLE_KEY");
  if (!url || !key) return null;
  const initial = new Map<string, string>();
  for (const entry of header.split(";")) {
    const end = entry.indexOf("=");
    if (end < 1) continue;
    const name = entry.slice(0, end).trim();
    try { initial.set(name, decodeURIComponent(entry.slice(end + 1).trim())); } catch { /* malformed cookie */ }
  }
  return createServerClient(url, key, {
    cookies: {
      getAll: () => Array.from(initial, ([name, value]) => ({ name, value })),
      setAll: (updates) => {
        for (const { name, value, options } of updates) {
          initial.set(name, value);
          cookies.set(name, value, { ...options, path: "/", httpOnly: true, sameSite: "lax",
            secure: (config("ORIGIN") ?? "").startsWith("https:") });
        }
      },
    },
  });
}

export function privatePage(headers: Headers) {
  headers.set("Cache-Control", "private, no-store");
  headers.set("X-Robots-Tag", "noindex, nofollow");
  // "no-referrer" makes browsers send `Origin: null` on form posts, which the
  // action endpoint's origin check rejects. "same-origin" still leaks nothing off-site.
  headers.set("Referrer-Policy", "same-origin");
  headers.set("X-Content-Type-Options", "nosniff");
}

export async function boundedForm(request: Request, limit: number): Promise<FormData | null> {
  if (Number(request.headers.get("content-length")) > limit || !request.body) return null;
  const reader = request.body.getReader();
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let length = 0;
  try {
    for (;;) {
      const entry = await reader.read();
      if (entry.done) break;
      length += entry.value.length;
      if (length > limit) {
        await reader.cancel();
        return null;
      }
      chunks.push(new Uint8Array(entry.value));
    }
    return await new Response(new Blob(chunks), {
      headers: { "Content-Type": request.headers.get("content-type") ?? "" },
    }).formData();
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}

export function safeUrl(value: string | null | undefined) {
  try {
    const url = new URL(value ?? "");
    return url.protocol === "https:" && !url.username && !url.password ? url.href : undefined;
  } catch { return undefined; }
}
