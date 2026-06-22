import Link from "next/link";
import { login, signup } from "./actions";

export type AuthSearchParams = {
  error?: string | string[];
  blocked?: string | string[];
  code?: string | string[];
  invite?: string | string[];
  password_reset?: string | string[];
};

export function getFirstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function getAuthErrorMessage(error?: string, code?: string) {
  if (!error) return null;

  if (error === "missing_credentials") {
    return "Email and password are required.";
  }

  if (error === "invite_required") {
    return "Signup requires an admin invite link.";
  }

  if (error === "invalid_invite") {
    if (code === "missing") {
      return "This invite link is no longer valid. Ask your admin for a new invite link.";
    }

    if (code === "expired") {
      return "This invite link has expired. Ask your admin to send you a new invite.";
    }

    if (code === "revoked") {
      return "This invite link was revoked by an admin. Ask for a new invite if you still need access.";
    }

    if (code === "accepted") {
      return "This invite link has already been used. Sign in if your account already exists, or ask your admin for a new invite.";
    }

    if (code === "email_mismatch") {
      return "This invite is for a different email address. Use the same email address that received the invite.";
    }

    return "This invite link is not valid for signup. Ask your admin for a new invite.";
  }

  if (error === "invite_check_unavailable") {
    return "Invite validation is not configured on the server.";
  }

  if (error === "auth_callback_failed") {
    return "Unable to complete auth redirect. Try again.";
  }

  if (error === "invalid_login") {
    return code === "email_not_confirmed"
      ? "Email not confirmed yet. Check your inbox."
      : "Invalid email or password.";
  }

  if (error === "signup_failed") {
    if (code === "email_address_invalid") {
      return "Email address is invalid.";
    }

    if (code === "password_too_short") {
      return "Password is too short (min 6 characters).";
    }

    if (code === "over_email_send_rate_limit") {
      return "Signup email rate limit exceeded. Disable email confirmations in Supabase for local testing, or wait and try again.";
    }

    if (code === "signup_disabled") {
      return "Signups are disabled in Supabase Auth settings.";
    }

    return "Unable to sign up with those credentials.";
  }

  return "Something went wrong. Please try again.";
}

function getInviteRecipientGuidance() {
  return {
    title: "You were invited to join MyHello",
    body: "Create your account with the same email address your admin invited. Then choose a password to finish signup.",
    note: "If you use a different email address, signup will be blocked for safety.",
  };
}

function getInvalidInviteState(error?: string, code?: string) {
  if (error !== "invalid_invite") {
    return null;
  }

  if (code === "email_mismatch") {
    return {
      title: "Wrong email for this invite",
      body: "Use the exact email address that received the invite. You can correct the email below and try again.",
      blockForm: false,
    };
  }

  if (code === "expired") {
    return {
      title: "Invite expired",
      body: "This invite link is past its expiry date. Ask your admin to send you a fresh invite link.",
      blockForm: true,
    };
  }

  if (code === "revoked") {
    return {
      title: "Invite revoked",
      body: "An admin revoked this invite link, so it can no longer be used to create an account.",
      blockForm: true,
    };
  }

  if (code === "accepted") {
    return {
      title: "Invite already used",
      body: "This invite link has already been accepted. Sign in if your account was already created, or ask your admin for a new invite.",
      blockForm: true,
    };
  }

  return {
    title: "Invite not valid",
    body: "This invite link cannot be used to create an account. Ask your admin for a new invite link.",
    blockForm: true,
  };
}

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 items-center justify-center bg-[var(--color-bg)] px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-[var(--color-text)]">
          {title}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted)]">{description}</p>
        {children}
      </div>
    </div>
  );
}

export function AuthStatusBanners({
  error,
  blocked,
  code,
  isSupabaseConfigured,
  passwordReset,
  hiddenErrors,
}: {
  error?: string;
  blocked?: boolean;
  code?: string;
  isSupabaseConfigured: boolean;
  passwordReset?: boolean;
  hiddenErrors?: string[];
}) {
  const shouldHideError = error ? hiddenErrors?.includes(error) : false;
  const errorMessage = shouldHideError ? null : getAuthErrorMessage(error, code);

  return (
    <>
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

      {errorMessage ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {errorMessage}
        </div>
      ) : null}
    </>
  );
}

export function SignInForm({
  isSupabaseConfigured,
}: {
  isSupabaseConfigured: boolean;
}) {
  return (
    <form action={login} className="mt-6 grid gap-3">
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
            <input type="radio" name="login_mode" value="user" defaultChecked />
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

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link
          href="/auth/forgot-password"
          className="font-semibold text-[var(--color-text)] underline"
        >
          Forgot password?
        </Link>
        <Link
          href="/auth/sign-up"
          className="font-semibold text-[var(--color-text)] underline"
        >
          Create account
        </Link>
      </div>
    </form>
  );
}

export function InviteSignUpForm({
  inviteToken,
  isSupabaseConfigured,
  error,
  code,
}: {
  inviteToken: string;
  isSupabaseConfigured: boolean;
  error?: string;
  code?: string;
}) {
  if (!inviteToken) {
    return (
      <div className="mt-6 grid gap-4">
        <div className="rounded-lg border border-[var(--color-border)] p-3 text-sm text-[var(--color-muted)]">
          Signup is invite-only. Ask an admin for an invite link, then open that
          link to create your account.
        </div>
        <Link
          href="/auth/sign-in"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--color-border)] px-4 text-sm font-semibold text-[var(--color-text)]"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  const inviteGuidance = getInviteRecipientGuidance();
  const invalidInviteState = getInvalidInviteState(error, code);

  if (invalidInviteState?.blockForm) {
    return (
      <div className="mt-6 grid gap-4">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">{invalidInviteState.title}</p>
          <p className="mt-1">{invalidInviteState.body}</p>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] p-3 text-sm text-[var(--color-muted)]">
          Ask your admin for a new invite link, then open that new link to create your account.
        </div>
        <Link
          href="/auth/sign-in"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--color-border)] px-4 text-sm font-semibold text-[var(--color-text)]"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-4">
      <div className="rounded-lg border border-[var(--color-border)] p-4 text-sm text-[var(--color-muted)]">
        <p className="font-semibold text-[var(--color-text)]">
          {inviteGuidance.title}
        </p>
        <p className="mt-1">{inviteGuidance.body}</p>
        <p className="mt-2">{inviteGuidance.note}</p>
      </div>
      {invalidInviteState ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">{invalidInviteState.title}</p>
          <p className="mt-1">{invalidInviteState.body}</p>
        </div>
      ) : null}
      <form action={signup} className="grid gap-3">
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
        <Link
          href="/auth/sign-in"
          className="text-sm font-semibold text-[var(--color-text)] underline"
        >
          Back to sign in
        </Link>
      </form>
    </div>
  );
}
