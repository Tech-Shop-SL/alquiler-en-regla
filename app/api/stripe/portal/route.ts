import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function POST() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const site = process.env.NEXT_PUBLIC_SITE_URL!;
  if (!auth.user) return NextResponse.redirect(`${site}/login`, 303);

  const { data: profile } = await supabase.from("profiles").select("stripe_customer_id").eq("id", auth.user.id).single();
  if (!profile?.stripe_customer_id) return NextResponse.redirect(`${site}/app/plan`, 303);

  const session = await getStripe().billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${site}/app/plan`,
  });
  return NextResponse.redirect(session.url, 303);
}
