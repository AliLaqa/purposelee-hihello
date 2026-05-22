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

  // Guardrail: prevent self-delete (admin identity == auth user).
  if (userId === actorUserId) {
    redirect("/admin?error=self_delete_not_allowed");
  }

  // Guardrail: prevent deleting the last remaining admin.
  const { data: targetAdminRow } = await admin
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (targetAdminRow) {
    const { count } = await admin
      .from("admin_users")
      .select("user_id", { count: "exact", head: true });

    // Keep at least 2 admins to avoid lockouts and ensure continuity.
    if (typeof count === "number" && count <= 2) {
      redirect("/admin?error=cannot_delete_last_admin");
    }
  }

  // Cleanup Storage files (best-effort) to avoid orphaned avatars.
  // v1 path convention: `avatars/<user_id>/<uuid>.<ext>`
  try {
    const { data: files } = await admin.storage
      .from("avatars")
      .list(userId, { limit: 1000, offset: 0 });

    const filePaths =
      files
        ?.filter((f) => f.id && f.name)
        .map((f) => `${userId}/${f.name}`) ?? [];

    if (filePaths.length > 0) {
      await admin.storage.from("avatars").remove(filePaths);
    }
  } catch {
    // ignore cleanup failures (do not block user deletion)
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
