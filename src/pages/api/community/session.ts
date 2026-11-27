import type { APIRoute } from "astro";
import { communityClient } from "../../../server/community";

// Tells the header whether the visitor is signed in with an emailed code. The sign-in cookie is
// HttpOnly, so the browser can't read it itself. getUser() also renews an expired access token
// and writes the new cookies, which keeps the session alive while the member browses.
export const GET: APIRoute = async ({ request, cookies }) => {
  const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };
  const db = communityClient(cookies, request);
  if (!db) return Response.json({ signedIn: false }, { headers });
  try {
    const { data: { user } } = await db.auth.getUser();
    if (!user) return Response.json({ signedIn: false }, { headers });
    const [{ data: profile }, avatar] = await Promise.all([
      db.from("community_profiles").select("display_name").eq("id", user.id).maybeSingle(),
      // Photos live in private storage; a signed link lets the header show it for an hour.
      db.storage.from("community-avatars").createSignedUrl(`${user.id}/current`, 3600),
    ]);
    const name: string = profile?.display_name || user.email?.split("@")[0] || "Member";
    return Response.json({ signedIn: true, name, photo: avatar.data?.signedUrl ?? null }, { headers });
  } catch {
    return Response.json({ signedIn: false }, { headers });
  }
};
