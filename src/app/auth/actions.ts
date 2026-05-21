"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function getNextPath(formData: FormData) {
  const loginMode = String(formData.get("login_mode") || "user");
  return loginMode === "admin" ? "/admin" : "/dashboard";
}

export async function login(formData: FormData) {
  const supabase = await createClient();

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
    await supabase.auth.signOut();
    redirect("/auth?blocked=1");
  }

  redirect(getNextPath(formData));
}

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    redirect("/auth?error=missing_credentials");
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error || !data.user) {
    const code =
      (error && "code" in error && typeof error.code === "string"
        ? error.code
        : "") || "";
    redirect(`/auth?error=signup_failed${code ? `&code=${encodeURIComponent(code)}` : ""}`);
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth");
}
