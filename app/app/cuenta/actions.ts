"use server";

import { redirect } from "next/navigation";
import { createAdminClient, requireUser } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function deleteAccount() {
  const { supabase, user, profile } = await requireUser();

  try {
    if (profile.stripe_customer_id) {
      const stripe = getStripe();
      const subs = await stripe.subscriptions.list({ customer: profile.stripe_customer_id, status: "all", limit: 20 });
      for (const sub of subs.data) {
        if (sub.status !== "canceled" && sub.status !== "incomplete_expired") await stripe.subscriptions.cancel(sub.id);
      }
    }
    // Borra el usuario; profiles, properties, payments, rent_changes y extractions caen en cascada.
    const { error } = await createAdminClient().auth.admin.deleteUser(user.id);
    if (error) throw error;
  } catch (err) {
    console.error("deleteAccount", err);
    redirect("/app/cuenta?error=1");
  }

  await supabase.auth.signOut();
  redirect("/?cuenta=eliminada");
}
