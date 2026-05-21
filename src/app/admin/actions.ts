"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";

export async function setUserBlocked(formData: FormData) {
  const { userId: actorUserId } = await requireAdmin();
  const admin = createAdminClient();

  const userId = String(formData.get("user_id") || "");
  const block = String(formData.get("block") || "0") === "1";

  if (!userId) {
    redirect("/admin?error=missing_user");
  }

  await admin.from("profiles").update({ is_blocked: block }).eq("id", userId);
  await admin
    .from("cards")
    .update({ is_active: !block })
    .eq("user_id", userId);

  await admin.from("audit_events").insert({
    actor_user_id: actorUserId,
    action: block ? "admin.block_user" : "admin.unblock_user",
    target_type: "profile",
    target_id: userId,
    metadata: {},
  });

  revalidatePath("/admin");
  redirect("/admin");
}

export async function deleteUser(formData: FormData) {
  const { userId: actorUserId } = await requireAdmin();
  const admin = createAdminClient();

  const userId = String(formData.get("user_id") || "");
  if (!userId) {
    redirect("/admin?error=missing_user");
  }

  await admin.from("cards").delete().eq("user_id", userId);
  await admin.from("profiles").delete().eq("id", userId);

  // Delete auth user (best-effort)
  await admin.auth.admin.deleteUser(userId);

  await admin.from("audit_events").insert({
    actor_user_id: actorUserId,
    action: "admin.delete_user",
    target_type: "profile",
    target_id: userId,
    metadata: {},
  });

  revalidatePath("/admin");
  redirect("/admin");
}
