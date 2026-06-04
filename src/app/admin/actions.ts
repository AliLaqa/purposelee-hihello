"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomBytes } from "crypto";
import { requireAdmin } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";

async function deleteAvatarsForUser(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
) {
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
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function setUserBlocked(formData: FormData) {
  const { userId: actorUserId } = await requireAdmin();
  const admin = createAdminClient();

  const userId = String(formData.get("user_id") || "");
  const block = String(formData.get("block") || "0") === "1";
  const confirmed = String(formData.get("confirm_block_action") || "") === "1";

  if (!userId) {
    redirect("/admin?error=missing_user");
  }

  if (!confirmed) {
    redirect("/admin?error=block_confirm_required");
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

export async function updateAdminDisplayName(formData: FormData) {
  const { userId: actorUserId } = await requireAdmin();
  const admin = createAdminClient();

  const displayName = String(formData.get("display_name") || "").trim();

  await admin
    .from("profiles")
    .update({ display_name: displayName || null })
    .eq("id", actorUserId);

  await admin.from("audit_events").insert({
    actor_user_id: actorUserId,
    action: "admin.update_display_name",
    target_type: "profile",
    target_id: actorUserId,
    metadata: {},
  });

  revalidatePath("/admin");
  redirect("/admin?identity_updated=1");
}

export async function createInvite(formData: FormData) {
  const { userId: actorUserId } = await requireAdmin();
  const admin = createAdminClient();

  const email = normalizeEmail(String(formData.get("email") || ""));
  if (!email) {
    redirect("/admin?error=missing_invite_email");
  }

  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString();

  const { data: invite, error } = await admin
    .from("invites")
    .insert({
      email,
      token,
      created_by: actorUserId,
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (error || !invite) {
    redirect("/admin?error=invite_create_failed");
  }

  await admin.from("audit_events").insert({
    actor_user_id: actorUserId,
    action: "admin.create_invite",
    target_type: "invite",
    target_id: invite.id,
    metadata: { email },
  });

  revalidatePath("/admin");
  redirect("/admin?invite_created=1");
}

export async function revokeInvite(formData: FormData) {
  const { userId: actorUserId } = await requireAdmin();
  const admin = createAdminClient();

  const inviteId = String(formData.get("invite_id") || "");
  if (!inviteId) {
    redirect("/admin?error=missing_invite");
  }

  const { error } = await admin
    .from("invites")
    .update({ status: "revoked", revoked_at: new Date().toISOString() })
    .eq("id", inviteId)
    .eq("status", "pending");

  if (error) {
    redirect("/admin?error=invite_revoke_failed");
  }

  await admin.from("audit_events").insert({
    actor_user_id: actorUserId,
    action: "admin.revoke_invite",
    target_type: "invite",
    target_id: inviteId,
    metadata: {},
  });

  revalidatePath("/admin");
  redirect("/admin?invite_revoked=1");
}

export async function deleteUserCard(formData: FormData) {
  const { userId: actorUserId } = await requireAdmin();
  const admin = createAdminClient();

  const cardId = String(formData.get("card_id") || "");
  const userId = String(formData.get("user_id") || "");
  const confirmed = String(formData.get("confirm_delete_card") || "") === "1";

  if (!cardId || !userId) {
    redirect("/admin?error=missing_card");
  }

  if (!confirmed) {
    redirect("/admin?error=card_delete_confirm_required");
  }

  const { data: card } = await admin
    .from("cards")
    .select("id,user_id,avatar_path")
    .eq("id", cardId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!card) {
    redirect("/admin?error=missing_card");
  }

  if (card.avatar_path) {
    await admin.storage.from("avatars").remove([card.avatar_path]);
  }

  const { error } = await admin.from("cards").delete().eq("id", card.id);
  if (error) {
    redirect("/admin?error=card_delete_failed");
  }

  await admin.from("audit_events").insert({
    actor_user_id: actorUserId,
    action: "admin.delete_card",
    target_type: "card",
    target_id: card.id,
    metadata: { user_id: userId },
  });

  revalidatePath("/admin");
  redirect("/admin?card_deleted=1");
}

export async function deleteUser(formData: FormData) {
  const { userId: actorUserId } = await requireAdmin();
  const admin = createAdminClient();

  const userId = String(formData.get("user_id") || "");
  const confirmed = String(formData.get("confirm_delete_user") || "") === "1";
  if (!userId) {
    redirect("/admin?error=missing_user");
  }

  if (!confirmed) {
    redirect("/admin?error=user_delete_confirm_required");
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
    await deleteAvatarsForUser(admin, userId);
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
