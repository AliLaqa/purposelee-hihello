"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSupabaseSecretKey } from "@/lib/env";

function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/+$/, "");
  return "http://localhost:3000";
}

function getNextPath(formData: FormData) {
  const loginMode = String(formData.get("login_mode") || "user");
  return loginMode === "admin" ? "/admin" : "/dashboard";
}

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "(invalid email)";
  return `${local.slice(0, 2)}***@${domain}`;
}

async function getRequestLogContext() {
  const requestHeaders = await headers();
  return {
    host: requestHeaders.get("host"),
    origin: requestHeaders.get("origin"),
    referer: requestHeaders.get("referer"),
    forwardedHost: requestHeaders.get("x-forwarded-host"),
    forwardedProto: requestHeaders.get("x-forwarded-proto"),
  };
}

async function getRequestOrigin() {
  const requestHeaders = await headers();
  const explicitOrigin = requestHeaders.get("origin");
  if (explicitOrigin) {
    return explicitOrigin.replace(/\/+$/, "");
  }

  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const proto = requestHeaders.get("x-forwarded-proto") ?? "http";

  if (host) {
    return `${proto}://${host}`.replace(/\/+$/, "");
  }

  return getSiteUrl();
}

export async function login(formData: FormData) {
  const supabase = await createClient();

  const loginMode = String(formData.get("login_mode") || "user");
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    redirect("/auth?error=missing_credentials");
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    const code =
      (error && "code" in error && typeof error.code === "string"
        ? error.code
        : "") || "";
    redirect(`/auth?error=invalid_login${code ? `&code=${encodeURIComponent(code)}` : ""}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_blocked")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profile?.is_blocked) {
    // Blocked users cannot use the normal app. However, a blocked allowlisted admin
    // must still be able to access `/admin` to unblock/manage accounts.
    if (loginMode !== "admin") {
      await supabase.auth.signOut();
      redirect("/auth?blocked=1");
    }
  }

  redirect(getNextPath(formData));
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = String(formData.get("email") || "").trim();
  const normalizedEmail = email.toLowerCase();
  const password = String(formData.get("password") || "");
  const inviteToken = String(formData.get("invite_token") || "").trim();

  if (!email || !password) {
    redirect("/auth?error=missing_credentials");
  }

  if (!inviteToken) {
    redirect("/auth?error=invite_required");
  }

  if (!getSupabaseSecretKey()) {
    redirect("/auth?error=invite_check_unavailable");
  }

  const admin = createAdminClient();
  const { data: invite } = await admin
    .from("invites")
    .select("id,email,status,expires_at,created_by")
    .eq("token", inviteToken)
    .maybeSingle();

  if (
    !invite ||
    invite.status !== "pending" ||
    String(invite.email).toLowerCase() !== normalizedEmail ||
    (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now())
  ) {
    redirect("/auth?error=invalid_invite");
  }

  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
  });

  if (error || !data.user) {
    const code =
      (error && "code" in error && typeof error.code === "string"
        ? error.code
        : "") || "";
    redirect(`/auth?error=signup_failed${code ? `&code=${encodeURIComponent(code)}` : ""}`);
  }

  await admin
    .from("invites")
    .update({
      status: "accepted",
      accepted_user_id: data.user.id,
      accepted_at: new Date().toISOString(),
    })
    .eq("id", invite.id);

  await admin.from("audit_events").insert({
    actor_user_id: data.user.id,
    action: "invite.accepted",
    target_type: "invite",
    target_id: invite.id,
    metadata: { email: normalizedEmail, created_by: invite.created_by },
  });

  redirect("/dashboard");
}

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient();

  const email = String(formData.get("email") || "").trim();
  if (!email) {
    redirect("/auth/forgot-password?error=missing_email");
  }

  const requestOrigin = await getRequestOrigin();
  const redirectTo = `${requestOrigin}/auth/callback?next=/auth/reset-password`;
  console.log("Password reset requested", {
    email: maskEmail(email),
    siteUrl: getSiteUrl(),
    requestOrigin,
    redirectTo,
    request: await getRequestLogContext(),
  });

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    console.error("Password reset email request failed", {
      code: "code" in error && typeof error.code === "string" ? error.code : "",
      message: error.message,
      status: "status" in error ? error.status : undefined,
      request: await getRequestLogContext(),
    });
  }

  redirect("/auth/forgot-password?sent=1");
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();

  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirm_password") || "");

  if (!password || !confirmPassword) {
    redirect("/auth/reset-password?error=missing_password");
  }

  if (password.length < 6) {
    redirect("/auth/reset-password?error=password_too_short");
  }

  if (password !== confirmPassword) {
    redirect("/auth/reset-password?error=password_mismatch");
  }

  const { data: existingUser, error: existingUserError } =
    await supabase.auth.getUser();

  console.log("Password update attempted", {
    hasSessionUser: Boolean(existingUser.user),
    sessionUserId: existingUser.user?.id ?? null,
    sessionCheckError: existingUserError
      ? {
          code:
            "code" in existingUserError &&
            typeof existingUserError.code === "string"
              ? existingUserError.code
              : "",
          message: existingUserError.message,
          status: "status" in existingUserError ? existingUserError.status : undefined,
        }
      : null,
    request: await getRequestLogContext(),
  });

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    const code =
      "code" in error && typeof error.code === "string" ? error.code : "";

    console.error("Password update failed", {
      code,
      message: error.message,
      status: "status" in error ? error.status : undefined,
    });

    redirect(
      `/auth/reset-password?error=update_failed${
        code ? `&code=${encodeURIComponent(code)}` : ""
      }`
    );
  }

  await supabase.auth.signOut();
  redirect("/auth?password_reset=1");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth");
}
