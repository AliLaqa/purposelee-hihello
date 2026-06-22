"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { validateAvatarFile } from "@/lib/cards/avatar";
import { isValidSlug, slugify } from "@/lib/cards/slug";
import { randomUUID } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseSecretKey } from "@/lib/env";

type UserSupabaseClient = Awaited<ReturnType<typeof requireUser>>["supabase"];

function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/+$/, "");
  return "http://localhost:3000";
}

async function removeAvatarFiles(
  supabase: UserSupabaseClient,
  paths: string[],
) {
  if (!paths.length) return;

  const storage = getSupabaseSecretKey()
    ? createAdminClient().storage
    : supabase.storage;

  const { error } = await storage.from("avatars").remove(paths);

  if (error) {
    console.error("Avatar remove failed", { paths, error });
  }
}

export async function upsertCard(formData: FormData) {
  const { supabase, userId } = await requireUser();

  const fullName = String(formData.get("full_name") || "").trim();
  const company = String(formData.get("company") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const rawSlug = String(formData.get("slug") || "").trim();
  const removeAvatar = String(formData.get("remove_avatar") || "") === "1";

  if (!fullName || !company || !email || !phone) {
    redirect("/dashboard/card?error=missing_fields");
  }

  const slug = rawSlug ? slugify(rawSlug) : slugify(fullName);
  if (!isValidSlug(slug)) {
    redirect("/dashboard/card?error=invalid_slug");
  }

  const avatarFile = formData.get("avatar");
  const avatar =
    avatarFile && typeof avatarFile !== "string" ? avatarFile : null;
  const avatarValidationError = validateAvatarFile(avatar);

  if (avatarValidationError) {
    redirect(`/dashboard/card?error=${avatarValidationError}`);
  }

  const { data: existing } = await supabase
    .from("cards")
    .select("id,avatar_path,slug")
    .eq("user_id", userId)
    .maybeSingle();

  const existingAvatarPath = existing?.avatar_path ?? null;
  let avatarPath: string | null = removeAvatar ? null : existingAvatarPath;
  let uploadedAvatarPath: string | null = null;

  if (avatar && avatar.size > 0) {
    const extension = avatar.name.split(".").pop()?.toLowerCase() || "png";
    const safeExt = extension.replace(/[^a-z0-9]/g, "") || "png";
    const filename = `${randomUUID()}.${safeExt}`;
    const path = `${userId}/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, avatar, { upsert: false, contentType: avatar.type });

    if (uploadError) {
      console.error("Avatar upload failed", uploadError);
      redirect("/dashboard/card?error=avatar_upload_failed");
    }

    avatarPath = path;
    uploadedAvatarPath = path;
  }

  if (!existing) {
    const { error } = await supabase.from("cards").insert({
      user_id: userId,
      slug,
      full_name: fullName,
      company,
      email,
      phone,
      avatar_path: avatarPath,
      is_active: true,
    });

    if (error) {
      if (uploadedAvatarPath) {
        await removeAvatarFiles(supabase, [uploadedAvatarPath]);
      }

      console.error("Card insert failed", error);
      const isSlugConflict = String(error.message || "")
        .toLowerCase()
        .includes("duplicate key");
      redirect(
        `/dashboard/card?error=${isSlugConflict ? "slug_taken" : "save_failed"}`
      );
    }
  } else {
    const { error } = await supabase
      .from("cards")
      .update({
        slug,
        full_name: fullName,
        company,
        email,
        phone,
        avatar_path: avatarPath,
      })
      .eq("id", existing.id);

    if (error) {
      if (uploadedAvatarPath) {
        await removeAvatarFiles(supabase, [uploadedAvatarPath]);
      }

      console.error("Card update failed", error);
      const isSlugConflict = String(error.message || "")
        .toLowerCase()
        .includes("duplicate key");
      redirect(
        `/dashboard/card?error=${isSlugConflict ? "slug_taken" : "save_failed"}`
      );
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/card");
  revalidatePath(`/card/${slug}`);

  if (
    uploadedAvatarPath &&
    existingAvatarPath &&
    existingAvatarPath !== uploadedAvatarPath
  ) {
    await removeAvatarFiles(supabase, [existingAvatarPath]);
  }

  if (removeAvatar && !uploadedAvatarPath && existingAvatarPath) {
    await removeAvatarFiles(supabase, [existingAvatarPath]);
  }

  const shareUrl = `${getSiteUrl()}/card/${encodeURIComponent(slug)}`;
  redirect(`/dashboard/card?saved=1&share=${encodeURIComponent(shareUrl)}`);
}

export async function deleteMyCard(formData: FormData) {
  const { supabase, userId } = await requireUser();
  const confirmed = String(formData.get("confirm_delete") || "") === "1";

  if (!confirmed) {
    redirect("/dashboard/card?error=delete_confirm_required");
  }

  const { data: card } = await supabase
    .from("cards")
    .select("id,avatar_path")
    .eq("user_id", userId)
    .maybeSingle();

  if (!card) {
    redirect("/dashboard?card_deleted=1");
  }

  const { error } = await supabase.from("cards").delete().eq("id", card.id);
  if (error) {
    console.error("Card delete failed", error);
    redirect("/dashboard/card?error=delete_failed");
  }

  if (getSupabaseSecretKey()) {
    const admin = createAdminClient();

    if (card.avatar_path) {
      await admin.storage.from("avatars").remove([card.avatar_path]);
    }

    await admin.from("audit_events").insert({
      actor_user_id: userId,
      action: "user.delete_card",
      target_type: "card",
      target_id: card.id,
      metadata: {},
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/card");
  redirect("/dashboard?card_deleted=1");
}
