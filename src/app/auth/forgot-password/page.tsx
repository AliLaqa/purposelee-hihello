import Link from "next/link";
import { requestPasswordReset } from "../actions";
import { getSupabasePublicConfig } from "@/lib/env";

export const dynamic = "force-dynamic";

type SearchParams = {
  error?: string;
  sent?: string;
};

function errorMessage(error?: string) {
  switch (error) {
    case "missing_email":
      return "Email is required.";
    default:
      return error ? "Unable to send reset email. Try again." : null;
  }
}

export default async function ForgotPasswordPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  const sent = searchParams.sent === "1";
  const error = errorMessage(searchParams.error);
  const isSupabaseConfigured = Boolean(getSupabasePublicConfig());

  return (
    <div className="flex flex-1 items-center justify-center bg-[var(--color-bg)] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-[var(--color-text)]">
          Reset password
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Enter your email and we will send a password reset link.
        </p>

        {sent ? (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            If that email exists, a reset link has been sent.
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            {error}
          </div>
        ) : null}

        <form action={requestPasswordReset} className="mt-6 grid gap-3">
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
          <button
            disabled={!isSupabaseConfigured}
            className="h-11 rounded-xl bg-[var(--color-primary)] text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send reset link
          </button>
        </form>

        <Link
          href="/auth/sign-in"
          className="mt-4 inline-flex text-sm font-semibold text-[var(--color-text)] underline"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
