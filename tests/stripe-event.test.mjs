import assert from "node:assert/strict";
import { test } from "node:test";
import Stripe from "stripe";
import { verifyCommunityStripeEvent } from "../src/server/stripe-event.ts";

test("requires a valid, current signature over the raw sandbox payload", async () => {
  const stripe = new Stripe("sk_test_local_fixture");
  const secret = "whsec_local_fixture";
  const payload = JSON.stringify({id:"evt_fixture",livemode:false,type:"invoice.paid",data:{object:{}}});
  const header = stripe.webhooks.generateTestHeaderString({payload,secret});
  assert.equal((await verifyCommunityStripeEvent(stripe,payload,header,secret)).id,"evt_fixture");
  await assert.rejects(verifyCommunityStripeEvent(stripe,payload+" ",header,secret));
  await assert.rejects(verifyCommunityStripeEvent(stripe,payload,header,"whsec_unrelated_fixture"));
  const expired = stripe.webhooks.generateTestHeaderString({payload,secret,timestamp:Math.floor(Date.now()/1000)-3600});
  await assert.rejects(verifyCommunityStripeEvent(stripe,payload,expired,secret));
  const live = JSON.stringify({id:"evt_live_fixture",livemode:true,type:"invoice.paid",data:{object:{}}});
  const liveHeader = stripe.webhooks.generateTestHeaderString({payload:live,secret});
  await assert.rejects(verifyCommunityStripeEvent(stripe,live,liveHeader,secret));
});
