import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { config } from "../../../server/community";
import { stripeTest } from "../../../server/community-stripe";
import { verifyCommunityStripeEvent } from "../../../server/stripe-event";

const id = (value: string | { id: string } | null | undefined) => typeof value === "string" ? value : value?.id;
const uuid = /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i;
async function subscriptionState(stripe: Stripe, subscription: string) {
  const current = await stripe.subscriptions.retrieve(subscription, { expand: ["latest_invoice"] });
  const user = current.metadata.community_user;
  const item = current.items.data[0];
  if (!uuid.test(user ?? "") || !item || current.livemode) return null;
  const invoice = typeof current.latest_invoice === "object" ? current.latest_invoice : null;
  const status = current.status === "active" && invoice?.status === "paid" ? "active"
    : current.status === "past_due" || current.status === "unpaid" ? "past_due"
    : current.status === "canceled" ? "canceled" : "inactive";
  return { type: "subscription", user, status, price: item.price.id, expires: new Date(item.current_period_end * 1000).toISOString(),
    customer: id(current.customer), subscription: current.id };
}

export const POST: APIRoute = async ({ request }) => {
  const stripe = stripeTest();
  const secret = config("STRIPE_WEBHOOK_SECRET");
  const url = config("SUPABASE_URL");
  const service = config("SUPABASE_SERVICE_ROLE_KEY");
  if (!stripe || !secret || !url || !service) return new Response(null, { status: 503 });
  const signature = request.headers.get("stripe-signature");
  if (!signature || Number(request.headers.get("content-length")) > 1_048_576) return new Response(null, { status: 400 });
  let event: Stripe.Event;
  try {
    const body = await request.text();
    if (body.length > 1_048_576) return new Response(null, { status: 413 });
    event = await verifyCommunityStripeEvent(stripe, body, signature, secret);
  } catch {
    return new Response(null, { status: 400 });
  }
  const db = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  try {
    let change: Record<string, unknown> | null = null;
    const apply = async (suffix: string, payload: Record<string, unknown>) => {
      const { error } = await db.rpc("community_apply_billing", { event_key: event.id + suffix, event_time: event.created, change: payload });
      if (error) throw new Error("Billing update failed");
    };
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        change = await subscriptionState(stripe, event.data.object.id);
        break;
      case "invoice.paid":
      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const subscription = id(invoice.parent?.subscription_details?.subscription);
        if (!subscription) break;
        change = await subscriptionState(stripe, subscription);
        if (event.type === "invoice.paid" && change) {
          await apply(":invoice", { type: "invoice_paid", user: change.user, payment: invoice.id, amount: invoice.amount_paid, currency: invoice.currency });
        }
        break;
      }
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object;
        const user = session.client_reference_id;
        const vendor = session.metadata?.vendor_application;
        const payment = id(session.payment_intent);
        if (session.mode !== "payment" || session.payment_status !== "paid" || !user || !vendor ||
          !uuid.test(user) || !uuid.test(vendor) || !payment || !session.currency || session.amount_total === null) break;
        change = { type: "vendor_paid", user, vendor, payment, currency: session.currency, amount: session.amount_total };
        break;
      }
      case "charge.refunded": {
        const charge = event.data.object;
        const payment = id(charge.payment_intent);
        if (!payment || !charge.refunded) break;
        const intent = await stripe.paymentIntents.retrieve(payment);
        const { community_user: user, vendor_application: vendor } = intent.metadata;
        if (!user || !vendor || !uuid.test(user) || !uuid.test(vendor)) break;
        change = { type: "vendor_refunded", user, vendor, payment, currency: charge.currency, amount: charge.amount };
        break;
      }
    }
    if (change) await apply("", change);
    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 503 });
  }
};
