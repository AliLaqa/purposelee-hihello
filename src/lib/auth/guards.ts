import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseSecretKey } from "@/lib/env";

export async function requireUser() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) {
    redirect("/auth");
  }

  const userId = data.claims.sub;

  let { data: profile } = await supabase
    .from("profiles")
    .select("id,is_blocked,email")
    .eq("id", userId)
    .maybeSingle();

  if (!profile && getSupabaseSecretKey()) {
    const admin = createAdminClient();
    const { data: authUser } = await admin.auth.admin.getUserById(userId);
    const email = authUser.user?.email ?? "";

    await admin
      .from("profiles")
      .upsert({ id: userId, email, display_name: null, is_blocked: false }, { onConflict: "id" });

    const res = await supabase
      .from("profiles")
      .select("id,is_blocked,email")
      .eq("id", userId)
      .maybeSingle();
    profile = res.data ?? null;
  }

  if (profile?.is_blocked) {
    await supabase.auth.signOut();
    redirect("/auth?blocked=1");
  }

  return { supabase, userId, profile };
}

export async function requireAdmin() {
  const { supabase, userId, profile } = await requireUser();

  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!adminRow) {
    redirect("/dashboard?not_admin=1");
  }

  return { supabase, userId, profile };
}
