import Link from "next/link";
import { updatePassword } from "../actions";

export const dynamic = "force-dynamic";

type SearchParams = {
  error?: string;
  code?: string;
};

function errorMessage(error?: string, code?: string) {
  switch (error) {
    case "missing_password":
      return "Password and confirmation are required.";
    case "password_too_short":
      return "Password is too short (min 6 characters).";
    case "password_mismatch":
      return "Passwords do not match.";
    case "update_failed":
      return code === "same_password"
        ? "Choose a password that is different from the old password."
        : "Unable to update password. Open the reset link again.";
    default:
      return error ? "Something went wrong. Try again." : null;
  }
}

export default async function ResetPasswordPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  const error = errorMessage(searchParams.error, searchParams.code);

  return (
    <div className="flex flex-1 items-center justify-center bg-[var(--color-bg)] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-[var(--color-text)]">
          Set new password
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Enter a new password for your MyHello account.
        </p>

        {error ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            {error}
          </div>
        ) : null}

        <form action={updatePassword} className="mt-6 grid gap-3">
          <label className="grid gap-1">
            <span className="text-xs font-medium text-[var(--color-muted)]">
              New password
            </span>
            <input
              name="password"
              type="password"
              minLength={6}
              required
              className="h-11 rounded-xl border border-[var(--color-border)] bg-transparent px-3 text-sm text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </label>
          <label className="grid gap-1">
            <span className="text-xs font-medium text-[var(--color-muted)]">
              Confirm password
            </span>
            <input
              name="confirm_password"
              type="password"
              minLength={6}
              required
              className="h-11 rounded-xl border border-[var(--color-border)] bg-transparent px-3 text-sm text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </label>
          <button className="h-11 rounded-xl bg-[var(--color-primary)] text-sm font-semibold text-white">
            Update password
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
