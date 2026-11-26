import Stripe from "stripe";
import { config } from "./community";

export function stripeTest() {
  const key = config("STRIPE_SECRET_KEY");
  return /^(sk|rk)_test_/.test(key ?? "") ? new Stripe(key!, { httpClient: Stripe.createFetchHttpClient() }) : null;
}
