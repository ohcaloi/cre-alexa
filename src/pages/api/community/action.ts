import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import { boundedForm, communityClient, config, safeUrl } from "../../../server/community";

const uuid = /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i;

export const GET: APIRoute = ({ redirect }) => redirect("/community/access", 303);

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const origin = config("ORIGIN");
  if (!origin || request.headers.get("origin") !== origin) return new Response(null, { status: 403 });
  if (Number(request.headers.get("content-length")) > 5_400_000) return new Response(null, { status: 413 });
  const db = communityClient(cookies, request);
  if (!db) return new Response("Membership service unavailable", { status: 503 });
  const form = await boundedForm(request, 5_400_000);
  if (!form) return new Response("Invalid form", { status: 400 });
  const value = (key: string, limit = 120) => String(form.get(key) ?? "").trim().slice(0, limit);
  const action = value("action");
  const gallery = () => value("gallery",5000).split(/\r?\n/).map(x=>safeUrl(x.trim())).filter((x):x is string=>Boolean(x)).slice(0,10);
  if (action === "request-code" || action === "verify-code") {
    const reply = (status: string, next = "/community/access") => {
      if (request.headers.get("accept")?.includes("application/json")) {
        return Response.json({ status, next }, { headers: { "Cache-Control": "no-store" } });
      }
      return redirect(next === "/community/access" ? `${next}?status=${status}` : next, 303);
    };
    const email = value("email", 254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return reply("invalid");
    try {
      if (action === "request-code") {
        const register = value("mode") === "register";
        const { error } = await db.auth.signInWithOtp({ email, options: { shouldCreateUser: register } });
        if (error?.status === 429) return reply("wait");
        if (error?.code === "captcha_failed") return reply("captcha");
        if (error && register) return reply("registration-unavailable");
        return reply("code");
      }
      const token = value("code", 12);
      if (!/^\d{6,10}$/.test(token)) return reply("invalid");
      const { error } = await db.auth.verifyOtp({ email, token, type: "email" });
      return error ? reply("invalid") : reply("verified", "/community/account");
    } catch {
      return reply("unavailable");
    }
  }
  const { data: { user } } = await db.auth.getUser();
  if (!user) return redirect("/community/access", 303);
  if (action === "logout") {
    await db.auth.signOut({ scope: "local" });
    return redirect("/community/access", 303);
  }
  if (action === "profile") {
    const name = value("name");
    const email = value("contact", 254);
    const website = value("website", 500);
    if (!name || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) || (website && !safeUrl(website))) {
      return redirect("/community/account?status=invalid", 303);
    }
    const { error } = await db.from("community_profiles").upsert({
      id: user.id, display_name: name, biography: value("bio", 4000), experience: value("experience", 4000),
      job_title: value("job"), company: value("company"), website, contact_email: email, notifications: form.has("notifications"),
    });
    return redirect(`/community/account?status=${error ? "invalid" : "saved"}`, 303);
  }
  if (action === "resume" || action === "avatar") {
    const file = form.get("file");
    if (!(file instanceof File)) return redirect("/community/account?status=file", 303);
    const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
    const jpeg = file.type === "image/jpeg" && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const png = file.type === "image/png" && bytes.join(",") === "137,80,78,71,13,10,26,10";
    const valid = action === "resume"
      ? file.size <= 5_242_880 && file.type === "application/pdf" && new TextDecoder().decode(bytes).startsWith("%PDF-")
      : file.size <= 2_097_152 && (jpeg || png);
    if (!valid) return redirect("/community/account?status=file", 303);
    const bucket = action === "resume" ? "community-resumes" : "community-avatars";
    const url = config("SUPABASE_URL");
    const key = config("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return new Response("Private uploads are unavailable", {status:503});
    const storage = createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}).storage;
    const { error } = await storage.from(bucket).upload(`${user.id}/current`, file, { contentType: file.type, upsert: true });
    return redirect(`/community/account?status=${error ? "invalid" : "saved"}`, 303);
  }
  if (action === "vendor" || action === "vendor-edit") {
    const name = value("name", 150);
    const category = value("category", 100);
    const description = value("description", 5000);
    const website = value("website", 500);
    if (!name || !category || !description || (website && !safeUrl(website))) return redirect("/community/account?status=invalid", 303);
    const prefix = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "vendor";
    const details = {
      name, category, description, website, location: value("location", 300), services: value("services",2000),
      logo_url:safeUrl(value("logo",500)),cover_url:safeUrl(value("image",500)),
      social_url:safeUrl(value("social",500)),gallery:gallery(),
    };
    const id = value("id");
    if (action === "vendor-edit" && !uuid.test(id)) return redirect("/community/account?status=invalid",303);
    const table = db.from("community_vendor_applications");
    const result = action === "vendor-edit" ? await table.update(details).eq("id",id).eq("user_id",user.id).select("id").maybeSingle()
      : await table.insert({...details,user_id:user.id,slug:`${prefix}-${crypto.randomUUID().slice(0,10)}`}).select("id").single();
    return redirect(`/community/account?status=${result.error || !result.data ? "invalid" : "saved"}`, 303);
  }
  if ((action === "event" || action === "moderate") && uuid.test(value("id"))) {
    const result = action === "event"
      ? await db.rpc("community_register", { event: value("id") })
      : await db.rpc("community_moderate_vendor", { application: value("id"), approved: value("decision") === "approve" });
    const page = action === "moderate" ? "admin" : "account";
    return redirect(`/community/${page}?status=${result.data === true ? "saved" : "invalid"}`, 303);
  }
  if (action === "verify-mfa") {
    const { error } = await db.auth.mfa.challengeAndVerify({ factorId: value("factor"), code: value("code") });
    if (!error) cookies.delete("community-totp", {path:"/community/security"});
    return redirect(error ? "/community/security?status=invalid" : "/community/admin", 303);
  }
  if (action === "enroll-mfa") {
    const result = await db.auth.mfa.enroll({ factorType: "totp", issuer: "CRE Alexa" });
    if (result.error || !result.data?.totp) return redirect("/community/security?status=invalid", 303);
    cookies.set("community-totp", JSON.stringify({ id: result.data.id, secret: result.data.totp.secret }), {
      path: "/community/security", httpOnly: true, sameSite: "strict", maxAge: 300, secure: origin.startsWith("https:"),
    });
    return redirect("/community/security", 303);
  }
  if (action === "record") {
    const kind = value("kind");
    const title = value("title",180);
    const slug = value("slug");
    const startsAt = value("starts_at");
    const venue = value("venue");
    const owner = value("owner");
    const capacity = Number(value("capacity"));
    const minimumLevel = Number(value("minimum_level"));
    const sortOrder = Number(value("sort_order"));
    const website = value("website",500);
    const image = value("image",500);
    const { data: allowed } = await db.rpc("community_admin", { required_role: "editor" });
    if (!allowed) return new Response(null, {status:403});
    if (!["event","article","venue","sponsor"].includes(kind) || !title ||
      !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) ||
      (startsAt && !/(?:Z|[+-]\d{2}:\d{2})$/.test(startsAt)) ||
      (startsAt && Number.isNaN(Date.parse(startsAt))) ||
      (kind === "event" && !startsAt) || (venue && !uuid.test(venue)) || (owner && !uuid.test(owner)) ||
      !Number.isInteger(capacity) || capacity < 0 || capacity > 100_000 ||
      ![0,1,2,3].includes(minimumLevel) || !Number.isInteger(sortOrder) || Math.abs(sortOrder)>100_000 ||
      (website && !safeUrl(website)) || (image && !safeUrl(image))) return redirect("/community/admin?status=invalid",303);
    const {error} = await db.from("community_records").upsert({
      kind,slug,title,description:value("description",12000),image_url:image || null,website:website || null,
      address:value("address",500), starts_at:startsAt || null, venue_id:venue || null,
      capacity:capacity || null, minimum_level:minimumLevel, sort_order:sortOrder, published:form.has("published"),
      owner_id:kind==="sponsor" && owner ? owner : null, sponsor_tier:value("sponsor_tier"),
      category:value("category",100),social_url:safeUrl(value("social",500)) ?? null,gallery:gallery(),
    }, {onConflict:"kind,slug"});
    return redirect(`/community/admin?status=${error ? "invalid":"saved"}`,303);
  }
  if (action === "parking") {
    const venue = value("venue");
    const title = value("title");
    const address = value("address",500);
    const { data: allowed } = await db.rpc("community_admin", { required_role: "editor" });
    if (!allowed) return new Response(null,{status:403});
    if (!uuid.test(venue) || !title || !address) return redirect("/community/admin?status=invalid",303);
    const {error} = await db.from("community_parking").upsert({
      venue_id:venue,title,address,fees:value("fees",500),
    },{onConflict:"venue_id,title"});
    return redirect(`/community/admin?status=${error ? "invalid":"saved"}`,303);
  }
  if (action === "plan") {
    const { data: allowed } = await db.rpc("community_admin", { required_role: "manager" });
    if (!allowed) return new Response(null,{status:403});
    const code = value("plan");
    const price = value("price");
    const title = value("title");
    if (!["standard","premium","sponsor"].includes(code) || !title || (price && !/^price_[A-Za-z0-9]+$/.test(price))) {
      return redirect("/community/admin?status=invalid",303);
    }
    const {error} = await db.from("community_plans").update({
      title,stripe_price:price || null,price_label:value("price_label"),
      benefits:value("benefits",3000).split("\n").map(x=>x.trim()).filter(Boolean),
      enabled:form.has("enabled"),
    }).eq("code",code);
    return redirect(`/community/admin?status=${error ? "invalid":"saved"}`,303);
  }
  if (action === "sponsor" && uuid.test(value("id"))) {
    const result = await db.rpc("community_edit_sponsor",{
      record_id:value("id"), description_text:value("description",12000),
      website_url:safeUrl(value("website",500)) ?? "", social_link:safeUrl(value("social",500)) ?? "",
      photo_links:gallery(),
    });
    return redirect(`/community/account?status=${result.data === true ? "saved":"invalid"}`,303);
  }
  return new Response("Unsupported action", { status: 400 });
};
