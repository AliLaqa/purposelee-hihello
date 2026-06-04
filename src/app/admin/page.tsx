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

export const dynamic = "force-dynamic";

type SearchParams = {
  error?: string;
  identity_updated?: string;
  card_deleted?: string;
  invite_created?: string;
  invite_revoked?: string;
};

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
            : searchParams.error === "self_delete_not_allowed"
            ? "You cannot delete your own admin account."
            : searchParams.error === "cannot_delete_last_admin"
            ? "You must keep at least two admins."
            : searchParams.error === "missing_card"
            ? "Missing card id."
            : searchParams.error === "card_delete_confirm_required"
            ? "Confirm card deletion before deleting."
            : searchParams.error === "card_delete_failed"
            ? "Unable to delete card."
            : searchParams.error === "missing_invite_email"
            ? "Invite email is required."
            : searchParams.error === "invite_create_failed"
            ? "Unable to create invite."
            : searchParams.error === "missing_invite"
            ? "Missing invite id."
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
              className="h-10 flex-1 rounded-xl border border-[var(--color-border)] bg-transparent px-3 text-sm text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
            <button className="h-10 rounded-xl border border-[var(--color-border)] px-3 text-sm font-semibold text-[var(--color-text)]">
              Save name
            </button>
          </div>
        </label>
      </form>

      <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <h2 className="text-sm font-semibold text-[var(--color-text)]">
          Invites
        </h2>
        <form action={createInvite} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            name="email"
            type="email"
            required
            placeholder="employee@example.com"
            className="h-10 flex-1 rounded-xl border border-[var(--color-border)] bg-transparent px-3 text-sm text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
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

            return (
              <div
                key={invite.id}
                className="rounded-xl border border-[var(--color-border)] p-3"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-[var(--color-text)]">
                      {invite.email}
                    </div>
                    <div className="mt-1 break-all text-xs text-[var(--color-muted)]">
                      {inviteUrl}
                    </div>
                    <div className="mt-1 text-xs text-[var(--color-muted)]">
                      Status: {invite.status}
                      {invite.expires_at ? ` · Expires: ${new Date(invite.expires_at).toLocaleDateString()}` : ""}
                    </div>
                  </div>
                  {invite.status === "pending" ? (
                    <div className="flex items-center gap-2">
                      <InviteCopyButton url={inviteUrl} />
                      <form action={revokeInvite}>
                        <input type="hidden" name="invite_id" value={invite.id} />
                        <button className="h-8 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700">
                          Revoke
                        </button>
                      </form>
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
        <div className="grid grid-cols-[2fr_1fr_1fr] gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-xs font-semibold text-[var(--color-muted)]">
          <div>User</div>
          <div>Status</div>
          <div className="text-right">Actions</div>
        </div>
        <div className="divide-y divide-[var(--color-border)]">
          {(users ?? []).map((u) => {
            const firstCard = Array.isArray(u.cards) ? u.cards[0] : null;
            const slug = firstCard?.slug ?? null;
            const name = firstCard?.full_name ?? null;
            const cardId = firstCard?.id ?? null;

            return (
              <div
                key={u.id}
                className="grid grid-cols-[2fr_1fr_1fr] gap-3 px-4 py-3"
              >
                <div className="min-w-0">
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
                  {cardId ? (
                    <form action={deleteUserCard} className="mt-3 grid gap-2">
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
                      <button className="h-8 w-fit rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700">
                        Delete card only
                      </button>
                    </form>
                  ) : null}
                </div>

                <div className="flex items-center">
                  {u.is_blocked ? (
                    <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                      Blocked
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">
                      Active
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2">
                  <form action={setUserBlocked}>
                    <input type="hidden" name="user_id" value={u.id} />
                    <input
                      type="hidden"
                      name="block"
                      value={u.is_blocked ? "0" : "1"}
                    />
                    <button className="h-9 rounded-xl border border-[var(--color-border)] px-3 text-xs font-semibold text-[var(--color-text)]">
                      {u.is_blocked ? "Unblock" : "Block"}
                    </button>
                  </form>

                  {u.id === actorUserId ? null : (
                    <form action={deleteUser}>
                      <input type="hidden" name="user_id" value={u.id} />
                      <button className="h-9 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700">
                        Delete
                      </button>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
