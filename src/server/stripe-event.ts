import Stripe from "stripe";

export async function verifyCommunityStripeEvent(stripe: Stripe, body: string, signature: string, secret: string) {
  const event = await stripe.webhooks.constructEventAsync(
    body, signature, secret, undefined, Stripe.createSubtleCryptoProvider(),
  );
  if (event.livemode) throw new Error("Expected a sandbox event");
  return event;
}
