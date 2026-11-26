import type { APIRoute } from "astro";
import { boundedForm, communityClient, config } from "../../../server/community";
import { stripeTest } from "../../../server/community-stripe";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const origin = config("ORIGIN");
  if (!origin || request.headers.get("origin") !== origin) return new Response(null, { status: 403 });
  const db = communityClient(cookies, request);
  const stripe = stripeTest();
  if (!db || !stripe) return new Response("Test billing is unavailable.", { status: 503 });
  const { data: { user } } = await db.auth.getUser();
  if (!user || !user.email) return redirect("/community/access", 303);
  const form = await boundedForm(request, 8192);
  if (!form) return new Response(null, { status: 400 });
  const action = form.get("action");
  const { data: member } = await db.from("community_memberships").select("stripe_customer").eq("user_id", user.id).maybeSingle();
  const returnUrl = `${origin}/community/account`;
  try {
    if (action === "portal" || (action === "membership" && member?.stripe_customer)) {
      if (!member?.stripe_customer) return redirect("/community/account?status=invalid", 303);
      const portal = await stripe.billingPortal.sessions.create({ customer: member.stripe_customer, return_url: returnUrl });
      return redirect(portal.url, 303);
    }
    const day = new Date().toISOString().slice(0, 10);
    if (action === "membership" && typeof form.get("plan") === "string") {
      const { data: plan } = await db.from("community_plans").select("stripe_price,enabled").eq("code", form.get("plan")).maybeSingle();
      if (!plan?.enabled || !plan.stripe_price) return redirect("/community/membership?status=unavailable", 303);
      const session = await stripe.checkout.sessions.create({
        mode: "subscription", customer_email: user.email, client_reference_id: user.id,
        line_items: [{ price: plan.stripe_price, quantity: 1 }],
        subscription_data: { metadata: { community_user: user.id } },
        success_url: `${returnUrl}?status=payment`, cancel_url: `${origin}/community/membership`,
      }, { idempotencyKey: `membership:${user.id}:${day}` });
      if (session.url) return redirect(session.url, 303);
    }
    if (action === "vendor" && typeof form.get("id") === "string") {
      const price = config("VENDOR_PRICE_ID");
      const { data: level } = await db.rpc("community_my_level");
      const { data: listing } = await db.from("community_vendor_applications").select("id,status")
        .eq("id", form.get("id")).eq("user_id", user.id).maybeSingle();
      if (!price || !level || listing?.status !== "pending_payment") return redirect("/community/account?status=invalid", 303);
      const session = await stripe.checkout.sessions.create({
        mode: "payment", ...(member?.stripe_customer ? { customer: member.stripe_customer } : { customer_email: user.email }),
        client_reference_id: user.id, line_items: [{ price, quantity: 1 }],
        metadata: { vendor_application: listing.id },
        payment_intent_data: { metadata: { vendor_application: listing.id, community_user: user.id } },
        success_url: `${returnUrl}?status=payment`, cancel_url: returnUrl,
      }, { idempotencyKey: `vendor:${listing.id}:${day}` });
      if (session.url) return redirect(session.url, 303);
    }
  } catch {
    return redirect("/community/account?status=billing", 303);
  }
  return new Response(null, { status: 400 });
};
