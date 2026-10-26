// Webhook de Stripe: activa o desactiva el plan Pro.
// Eventos a configurar en Stripe: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted.

import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

const ACTIVE = new Set<Stripe.Subscription.Status>(["active", "trialing", "past_due"]);

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature ?? "", process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Firma no válida" }, { status: 400 });
  }

  const admin = createAdminClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.client_reference_id;
    const customer = typeof session.customer === "string" ? session.customer : session.customer?.id;
    if (userId) {
      await admin.from("profiles").update({ plan: "pro", stripe_customer_id: customer ?? null }).eq("id", userId);
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const sub = event.data.object;
    const userId = sub.metadata?.user_id;
    const plan = event.type === "customer.subscription.updated" && ACTIVE.has(sub.status) ? "pro" : "free";
    if (userId) await admin.from("profiles").update({ plan }).eq("id", userId);
  }

  return NextResponse.json({ received: true });
}
