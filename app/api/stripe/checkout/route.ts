import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const site = process.env.NEXT_PUBLIC_SITE_URL!;
  if (!auth.user) return NextResponse.redirect(`${site}/login`, 303);

  const form = await request.formData();
  const price = form.get("interval") === "year"
    ? process.env.STRIPE_PRICE_YEARLY!
    : process.env.STRIPE_PRICE_MONTHLY!;

  const { data: profile } = await supabase.from("profiles").select("stripe_customer_id").eq("id", auth.user.id).single();

  const session = await getStripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    client_reference_id: auth.user.id,
    customer: profile?.stripe_customer_id ?? undefined,
    customer_email: profile?.stripe_customer_id ? undefined : auth.user.email,
    subscription_data: { metadata: { user_id: auth.user.id } },
    allow_promotion_codes: true,
    locale: "es",
    success_url: `${site}/app/plan?ok=1`,
    cancel_url: `${site}/app/plan`,
  });

  return NextResponse.redirect(session.url!, 303);
}
