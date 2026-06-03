import Link from "next/link";
import { login, signup } from "./actions";
import { getSupabasePublicConfig } from "@/lib/env";

export const dynamic = "force-dynamic";

type SearchParams = {
  error?: string;
  blocked?: string;
  code?: string;
  invite?: string;
  password_reset?: string;
};

export default async function AuthPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  const error = searchParams.error;
  const blocked = searchParams.blocked === "1";
  const code = searchParams.code;
  const inviteToken = searchParams.invite ?? "";
  const passwordReset = searchParams.password_reset === "1";
  const isSupabaseConfigured = Boolean(getSupabasePublicConfig());

  return (
    <div className="flex flex-1 items-center justify-center bg-[var(--color-bg)] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-[var(--color-text)]">
          MyHello
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Sign in to create and share your digital card.
        </p>

        {!isSupabaseConfigured ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Supabase is not configured. Set{" "}
            <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="font-mono">
              NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
            </code>{" "}
            in <code className="font-mono">.env.local</code>.
          </div>
        ) : null}

        {blocked ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            Your account is blocked. Contact an admin.
          </div>
        ) : null}

        {passwordReset ? (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            Password updated. Sign in with your new password.
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            {error === "missing_credentials"
              ? "Email and password are required."
              : error === "invite_required"
              ? "Signup requires an admin invite link."
              : error === "invalid_invite"
              ? "This invite is invalid, expired, or does not match that email."
              : error === "invite_check_unavailable"
              ? "Invite validation is not configured on the server."
              : error === "auth_callback_failed"
              ? "Unable to complete auth redirect. Try again."
              : error === "invalid_login"
              ? code === "email_not_confirmed"
                ? "Email not confirmed yet. Check your inbox."
                : "Invalid email or password."
              : error === "signup_failed"
              ? code === "email_address_invalid"
                ? "Email address is invalid."
              : code === "password_too_short"
                ? "Password is too short (min 6 characters)."
              : code === "over_email_send_rate_limit"
                ? "Signup email rate limit exceeded. Disable email confirmations in Supabase for local testing, or wait and try again."
                : code === "signup_disabled"
                ? "Signups are disabled in Supabase Auth settings."
                : "Unable to sign up with those credentials."
              : "Something went wrong. Please try again."}
          </div>
        ) : null}

        <div className="mt-6 grid gap-6">
          <section>
            <h2 className="text-sm font-semibold text-[var(--color-text)]">
              Sign in
            </h2>
            <form action={login} className="mt-3 grid gap-3">
              <label className="grid gap-1">
                <span className="text-xs font-medium text-[var(--color-muted)]">
                  Email
                </span>
                <input
                  name="email"
                  type="email"
                  required
                  className="h-11 rounded-xl border border-[var(--color-border)] bg-transparent px-3 text-sm text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-xs font-medium text-[var(--color-muted)]">
                  Password
                </span>
                <input
                  name="password"
                  type="password"
                  required
                  className="h-11 rounded-xl border border-[var(--color-border)] bg-transparent px-3 text-sm text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </label>

              <fieldset className="mt-1">
                <legend className="text-xs font-medium text-[var(--color-muted)]">
                  Login mode
                </legend>
                <div className="mt-2 flex gap-2">
                  <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)]">
                    <input
                      type="radio"
                      name="login_mode"
                      value="user"
                      defaultChecked
                    />
                    Normal login
                  </label>
                  <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)]">
                    <input type="radio" name="login_mode" value="admin" />
                    Admin login
                  </label>
                </div>
              </fieldset>

              <button
                disabled={!isSupabaseConfigured}
                className="mt-1 h-11 rounded-xl bg-[var(--color-primary)] text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                Sign in
              </button>
              <Link
                href="/auth/forgot-password"
                className="text-sm font-semibold text-[var(--color-text)] underline"
              >
                Forgot password?
              </Link>
            </form>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-[var(--color-text)]">
              Create account
            </h2>
            {!inviteToken ? (
              <div className="mt-3 rounded-lg border border-[var(--color-border)] p-3 text-sm text-[var(--color-muted)]">
                Signup is invite-only. Ask an admin for an invite link.
              </div>
            ) : (
            <form action={signup} className="mt-3 grid gap-3">
              <input type="hidden" name="invite_token" value={inviteToken} />
              <label className="grid gap-1">
                <span className="text-xs font-medium text-[var(--color-muted)]">
                  Email
                </span>
                <input
                  name="email"
                  type="email"
                  required
                  className="h-11 rounded-xl border border-[var(--color-border)] bg-transparent px-3 text-sm text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-xs font-medium text-[var(--color-muted)]">
                  Password
                </span>
                <input
                  name="password"
                  type="password"
                  required
                  className="h-11 rounded-xl border border-[var(--color-border)] bg-transparent px-3 text-sm text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </label>
              <button
                disabled={!isSupabaseConfigured}
                className="mt-1 h-11 rounded-xl border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Sign up
              </button>
            </form>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
