import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createInvite,
  deleteUser,
  deleteUserCard,
  revokeInvite,
  setUserBlocked,
  updateAdminDisplayName,
} from "./actions";
import { getSupabaseSecretKey } from "@/lib/env";
import { signOut } from "@/app/auth/actions";
import InviteCopyButton from "./invite_copy_button";
import AdminRefreshButton from "./admin_refresh_button";

export const dynamic = "force-dynamic";

type SearchParams = {
  error?: string;
  identity_updated?: string;
  card_deleted?: string;
  invite_created?: string;
  invite_revoked?: string;
};

function getInviteStatusMeta(status: string, expiresAt: string | null) {
  const isExpired =
    status === "pending" &&
    Boolean(expiresAt) &&
    new Date(expiresAt as string).getTime() < Date.now();

  if (isExpired) {
    return { label: "expired", className: "text-amber-700", isPending: false };
  }

  if (status === "accepted") {
    return {
      label: "accepted",
      className: "text-emerald-700",
      isPending: false,
    };
  }

  if (status === "revoked") {
    return { label: "revoked", className: "text-red-700", isPending: false };
  }

  return {
    label: "pending",
    className: "text-yellow-500",
    isPending: true,
  };
}

function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/+$/, "");
  return "http://localhost:3000";
}

export default async function AdminPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const { userId: actorUserId, profile } = await requireAdmin();
  if (!getSupabaseSecretKey()) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h1 className="text-lg font-semibold text-[var(--color-text)]">
            Admin not configured
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Set <code className="font-mono">SUPABASE_SECRET_KEY</code> on the
            server to enable admin actions.
          </p>
          <div className="mt-4">
            <Link className="underline" href="/dashboard">
              Go back
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const admin = createAdminClient();
  const searchParams = await props.searchParams;
  const { data: authUser } = await admin.auth.admin.getUserById(actorUserId);
  const adminEmail = authUser.user?.email ?? profile?.email ?? "Unknown admin";
  const adminName =
    "display_name" in (profile ?? {}) && typeof profile?.display_name === "string"
      ? profile.display_name
      : "";

  const { data: users } = await admin
    .from("profiles")
    .select("id,email,is_blocked,created_at,cards(id,slug,full_name,avatar_path)")
    .order("created_at", { ascending: false })
    .limit(200);

  const { data: adminUsers } = await admin
    .from("admin_users")
    .select("user_id");

  const adminUserIds = new Set((adminUsers ?? []).map((row) => row.user_id));

  const { data: invites } = await admin
    .from("invites")
    .select("id,email,token,status,expires_at,created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">
            Admin
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Manage users and cards.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-right text-xs text-[var(--color-muted)]">
            Signed in as
            <div className="font-semibold text-[var(--color-text)]">
              {adminName || adminEmail}
            </div>
            {adminName ? <div>{adminEmail}</div> : null}
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Link
              href="/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center rounded-xl border border-[var(--color-border)] px-3 text-sm font-semibold text-[var(--color-text)]"
            >
              Go to dashboard
            </Link>
            <form action={signOut}>
              <button className="h-10 rounded-xl border border-[var(--color-border)] px-3 text-sm font-semibold text-[var(--color-text)]">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>

      {searchParams.error ? (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {searchParams.error === "missing_user"
            ? "Missing user id."
            : searchParams.error === "block_confirm_required"
            ? "Confirm block or unblock before continuing."
            : searchParams.error === "self_delete_not_allowed"
            ? "You cannot delete your own admin account."
            : searchParams.error === "cannot_delete_last_admin"
            ? "You must keep at least two admins."
            : searchParams.error === "missing_card"
            ? "Missing card id."
            : searchParams.error === "card_delete_confirm_required"
            ? "Confirm card deletion before deleting."
            : searchParams.error === "user_delete_confirm_required"
            ? "Confirm user deletion before deleting."
            : searchParams.error === "card_delete_failed"
            ? "Unable to delete card."
            : searchParams.error === "missing_invite_email"
            ? "Invite email is required."
            : searchParams.error === "invite_create_failed"
            ? "Unable to create invite."
            : searchParams.error === "missing_invite"
            ? "Missing invite id."
            : searchParams.error === "invite_revoke_confirm_required"
            ? "Confirm invite revocation before revoking."
            : searchParams.error === "invite_revoke_failed"
            ? "Unable to revoke invite."
            : "Something went wrong."}
        </div>
      ) : null}

      {searchParams.identity_updated === "1" ? (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          Admin display name updated.
        </div>
      ) : null}

      {searchParams.card_deleted === "1" ? (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          Card deleted.
        </div>
      ) : null}

      {searchParams.invite_created === "1" ? (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          Invite created.
        </div>
      ) : null}

      {searchParams.invite_revoked === "1" ? (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          Invite revoked.
        </div>
      ) : null}

      <form
        action={updateAdminDisplayName}
        className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
      >
        <label className="grid gap-1">
          <span className="text-xs font-medium text-[var(--color-muted)]">
            Admin display name
          </span>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              name="display_name"
              defaultValue={adminName}
              placeholder={adminEmail}
              className="min-h-14 w-full appearance-none rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3.5 text-base leading-6 font-medium text-slate-100 caret-slate-100 outline-none placeholder:text-slate-400 [-webkit-text-fill-color:#f1f5f9] focus:bg-white focus:text-slate-900 focus:caret-slate-900 focus:placeholder:text-slate-400 focus:[-webkit-text-fill-color:#0f172a] focus:ring-2 focus:ring-[var(--color-primary)] sm:min-h-12 sm:py-3 sm:text-sm"
            />
            <button className="h-10 rounded-xl border border-[var(--color-border)] px-3 text-sm font-semibold text-[var(--color-text)]">
              Save name
            </button>
          </div>
        </label>
      </form>

      <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">
            Invites
          </h2>
          <AdminRefreshButton label="Invites" />
        </div>
        <form action={createInvite} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            name="email"
            type="email"
            required
            placeholder="employee@example.com"
            className="min-h-14 w-full appearance-none rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3.5 text-base leading-6 font-medium text-slate-100 caret-slate-100 outline-none placeholder:text-slate-400 [-webkit-text-fill-color:#f1f5f9] focus:bg-white focus:text-slate-900 focus:caret-slate-900 focus:placeholder:text-slate-400 focus:[-webkit-text-fill-color:#0f172a] focus:ring-2 focus:ring-[var(--color-primary)] sm:min-h-12 sm:py-3 sm:text-sm"
          />
          <button className="h-10 rounded-xl border border-[var(--color-border)] px-3 text-sm font-semibold text-[var(--color-text)]">
            Create invite
          </button>
        </form>

        <div className="mt-4 grid gap-3">
          {(invites ?? []).map((invite) => {
            const inviteUrl = `${getSiteUrl()}/auth?invite=${encodeURIComponent(
              invite.token
            )}`;
            const inviteStatus = getInviteStatusMeta(
              invite.status,
              invite.expires_at ?? null
            );

            return (
              <div
                key={invite.id}
                className="rounded-xl border border-[var(--color-border)] p-3"
              >
                <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-[var(--color-text)]">
                      {invite.email}
                    </div>
                    <div className="mt-1 break-all text-xs text-[var(--color-muted)]">
                      {inviteUrl}
                    </div>
                    <div className="mt-1 text-xs text-[var(--color-muted)]">
                      Status:{" "}
                      <span className={inviteStatus.className}>
                        {inviteStatus.label}
                      </span>
                      {invite.expires_at ? ` · Expires: ${new Date(invite.expires_at).toLocaleDateString()}` : ""}
                    </div>
                  {inviteStatus.isPending ? (
                    <div className="mt-3 flex flex-wrap items-start gap-3">
                      <form action={revokeInvite} className="grid gap-2">
                        <input type="hidden" name="invite_id" value={invite.id} />
                        <label className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
                          <input
                            type="checkbox"
                            name="confirm_revoke_invite"
                            value="1"
                            required
                          />
                          Confirm revoke
                        </label>
                        <button className="h-8 w-fit rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700">
                          Revoke
                        </button>
                      </form>
                      <InviteCopyButton url={inviteUrl} />
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
          {(invites ?? []).length === 0 ? (
            <div className="text-sm text-[var(--color-muted)]">
              No invites yet.
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-xs font-semibold text-[var(--color-muted)]">
          <span>User</span>
          <AdminRefreshButton label="Users" />
        </div>
        <div className="divide-y divide-[var(--color-border)]">
          {(users ?? []).map((u) => {
            const firstCard = Array.isArray(u.cards) ? u.cards[0] : null;
            const slug = firstCard?.slug ?? null;
            const name = firstCard?.full_name ?? null;
            const cardId = firstCard?.id ?? null;
            const accountType = adminUserIds.has(u.id) ? "Admin" : "User";

            return (
              <div key={u.id} className="px-4 py-3">
                <div className="min-w-0">
                  <div className="mb-2 grid gap-1 text-xs text-[var(--color-muted)]">
                    <div className="flex items-center gap-2">
                      <span>Status</span>
                      {u.is_blocked ? (
                        <span className="text-xs font-semibold text-red-700">
                          Blocked
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-700">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Account type</span>
                      <span className="text-xs font-semibold text-[var(--color-text)]">
                        {accountType}
                      </span>
                    </div>
                  </div>
                  <div className="truncate text-sm font-semibold text-[var(--color-text)]">
                    {name || u.email}
                  </div>
                  <div className="truncate text-xs text-[var(--color-muted)]">
                    {u.email}
                  </div>
                  {slug ? (
                    <div className="mt-1 text-xs">
                      <Link
                        className="underline text-[var(--color-text)]"
                        href={`/card/${encodeURIComponent(slug)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        /card/{slug}
                      </Link>
                    </div>
                  ) : (
                    <div className="mt-1 text-xs text-[var(--color-muted)]">
                      No card
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap items-start gap-3">
                    <form action={setUserBlocked} className="grid gap-2">
                      <input type="hidden" name="user_id" value={u.id} />
                      <input
                        type="hidden"
                        name="block"
                        value={u.is_blocked ? "0" : "1"}
                      />
                      <label className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
                        <input
                          type="checkbox"
                          name="confirm_block_action"
                          value="1"
                          required
                        />
                        {u.is_blocked ? "Confirm unblock" : "Confirm block"}
                      </label>
                      <button className="h-8 w-fit rounded-xl border border-yellow-300 bg-yellow-50 px-3 text-xs font-semibold text-yellow-700">
                        {u.is_blocked ? "Unblock User" : "Block User"}
                      </button>
                    </form>

                    {cardId ? (
                      <form action={deleteUserCard} className="grid gap-2">
                        <input type="hidden" name="user_id" value={u.id} />
                        <input type="hidden" name="card_id" value={cardId} />
                        <label className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
                          <input
                            type="checkbox"
                            name="confirm_delete_card"
                            value="1"
                            required
                          />
                          Confirm card deletion
                        </label>
                        <button className="h-8 w-fit rounded-xl border border-amber-300 bg-amber-100 px-3 text-xs font-semibold text-amber-800">
                          Delete User cards
                        </button>
                      </form>
                    ) : null}

                    {u.id === actorUserId ? null : (
                      <form action={deleteUser} className="grid gap-2">
                        <input type="hidden" name="user_id" value={u.id} />
                        <label className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
                          <input
                            type="checkbox"
                            name="confirm_delete_user"
                            value="1"
                            required
                          />
                          Confirm user deletion
                        </label>
                        <button className="h-8 w-fit rounded-xl border border-red-300 bg-red-50 px-3 text-xs font-semibold text-red-700">
                          Delete User
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
