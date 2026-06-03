import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseSecretKey } from "@/lib/env";

type RequireUserOptions = {
  allowBlocked?: boolean;
};

export async function requireUser(options: RequireUserOptions = {}) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) {
    await supabase.auth.signOut();
    redirect("/auth");
  }

  const userId = data.user.id;

  let { data: profile } = await supabase
    .from("profiles")
    .select("id,is_blocked,email,display_name")
    .eq("id", userId)
    .maybeSingle();

  if (!profile && getSupabaseSecretKey()) {
    const admin = createAdminClient();
    const { data: authUser, error: authUserError } =
      await admin.auth.admin.getUserById(userId);

    if (authUserError || !authUser.user) {
      await supabase.auth.signOut();
      redirect("/auth");
    }

    const email = authUser.user.email ?? data.user.email ?? "";

    await admin
      .from("profiles")
      .upsert({ id: userId, email, display_name: null, is_blocked: false }, { onConflict: "id" });

    const res = await supabase
      .from("profiles")
      .select("id,is_blocked,email,display_name")
      .eq("id", userId)
      .maybeSingle();
    profile = res.data ?? null;
  }

  if (!profile) {
    await supabase.auth.signOut();
    redirect("/auth");
  }

  if (profile?.is_blocked) {
    if (!options.allowBlocked) {
      await supabase.auth.signOut();
      redirect("/auth?blocked=1");
    }
  }

  return { supabase, userId, profile };
}

export async function requireAdmin() {
  const { supabase, userId, profile } = await requireUser({ allowBlocked: true });

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
