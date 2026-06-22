import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import { requireAdmin } from "@/lib/auth/guards";
import { getSupabaseSecretKey } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { updateAdminDisplayName } from "./actions";
import {
  getFirstSearchParam,
  parseInvitePageSize,
  parseInviteStatusFilter,
  parsePositiveInt,
} from "./invites_shared";
import InvitesSection from "./invites_section";
import type {
  AdminUserListItem,
  InviteListItem,
  InviteStatusCounts,
} from "./types";
import UsersSection from "./users_section";

export const dynamic = "force-dynamic";

type SearchParams = {
  error?: string | string[];
  identity_updated?: string | string[];
  card_deleted?: string | string[];
  invite_created?: string | string[];
  invite_revoked?: string | string[];
  inviteStatus?: string | string[];
  invitePage?: string | string[];
  invitePageSize?: string | string[];
};

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
  const error = getFirstSearchParam(searchParams.error);
  const identityUpdated = getFirstSearchParam(searchParams.identity_updated);
  const cardDeleted = getFirstSearchParam(searchParams.card_deleted);
  const inviteCreated = getFirstSearchParam(searchParams.invite_created);
  const inviteRevoked = getFirstSearchParam(searchParams.invite_revoked);
  const inviteStatus = parseInviteStatusFilter(
    getFirstSearchParam(searchParams.inviteStatus),
  );
  const invitePageSize = parseInvitePageSize(
    getFirstSearchParam(searchParams.invitePageSize),
  );
  const requestedInvitePage = parsePositiveInt(
    getFirstSearchParam(searchParams.invitePage),
    1,
  );
  const nowIso = new Date().toISOString();

  const { data: authUser } = await admin.auth.admin.getUserById(actorUserId);
  const adminEmail = authUser.user?.email ?? profile?.email ?? "Unknown admin";
  const adminName =
    "display_name" in (profile ?? {}) &&
    typeof profile?.display_name === "string"
      ? profile.display_name
      : "";

  const [
    { data: users },
    { data: adminUsers },
    { count: pendingCount },
    { count: acceptedCount },
    { count: revokedCount },
    { count: expiredCount },
    { count: allCount },
  ] = await Promise.all([
    admin
      .from("profiles")
      .select("id,email,is_blocked,created_at,cards(id,slug,full_name,avatar_path)")
      .order("created_at", { ascending: false })
      .limit(200),
    admin.from("admin_users").select("user_id"),
    admin
      .from("invites")
      .select("id", { head: true, count: "exact" })
      .eq("status", "pending")
      .gte("expires_at", nowIso),
    admin
      .from("invites")
      .select("id", { head: true, count: "exact" })
      .eq("status", "accepted"),
    admin
      .from("invites")
      .select("id", { head: true, count: "exact" })
      .eq("status", "revoked"),
    admin
      .from("invites")
      .select("id", { head: true, count: "exact" })
      .eq("status", "pending")
      .lt("expires_at", nowIso),
    admin.from("invites").select("id", { head: true, count: "exact" }),
  ]);

  const inviteCounts: InviteStatusCounts = {
    pending: pendingCount ?? 0,
    accepted: acceptedCount ?? 0,
    revoked: revokedCount ?? 0,
    expired: expiredCount ?? 0,
    all: allCount ?? 0,
  };

  const totalInviteCount = inviteCounts[inviteStatus];
  const totalInvitePages = Math.max(
    1,
    Math.ceil(totalInviteCount / invitePageSize),
  );
  const currentInvitePage = Math.min(requestedInvitePage, totalInvitePages);

  let invitesQuery = admin
    .from("invites")
    .select("id,email,token,status,expires_at,created_at")
    .order("created_at", { ascending: false });

  if (inviteStatus === "pending") {
    invitesQuery = invitesQuery.eq("status", "pending").gte("expires_at", nowIso);
  } else if (inviteStatus === "accepted") {
    invitesQuery = invitesQuery.eq("status", "accepted");
  } else if (inviteStatus === "revoked") {
    invitesQuery = invitesQuery.eq("status", "revoked");
  } else if (inviteStatus === "expired") {
    invitesQuery = invitesQuery.eq("status", "pending").lt("expires_at", nowIso);
  }

  const inviteRangeStart = (currentInvitePage - 1) * invitePageSize;
  const inviteRangeEnd = inviteRangeStart + invitePageSize - 1;
  const { data: invites } = totalInviteCount
    ? await invitesQuery.range(inviteRangeStart, inviteRangeEnd)
    : { data: [] as InviteListItem[] };

  const adminUserIds = new Set((adminUsers ?? []).map((row) => row.user_id));
  const adminCount = adminUsers?.length ?? 0;
  const userRows: AdminUserListItem[] = (users ?? []).map((user) => {
    const firstCard = Array.isArray(user.cards) ? user.cards[0] : null;
    const accountType: "Admin" | "User" = adminUserIds.has(user.id)
      ? "Admin"
      : "User";

    return {
      id: user.id,
      email: user.email,
      is_blocked: user.is_blocked,
      name: firstCard?.full_name ?? null,
      slug: firstCard?.slug ?? null,
      cardId: firstCard?.id ?? null,
      accountType,
    };
  });

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

      {error ? (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {error === "missing_user"
            ? "Missing user id."
            : error === "block_confirm_required"
            ? "Confirm block or unblock before continuing."
            : error === "self_delete_not_allowed"
            ? "You cannot delete your own admin account."
            : error === "cannot_delete_last_admin"
            ? "You must keep at least two admins."
            : error === "missing_card"
            ? "Missing card id."
            : error === "card_delete_confirm_required"
            ? "Confirm card deletion before deleting."
            : error === "user_delete_confirm_required"
            ? "Confirm user deletion before deleting."
            : error === "card_delete_failed"
            ? "Unable to delete card."
            : error === "missing_invite_email"
            ? "Invite email is required."
            : error === "invite_create_failed"
            ? "Unable to create invite."
            : error === "missing_invite"
            ? "Missing invite id."
            : error === "invite_revoke_confirm_required"
            ? "Confirm invite revocation before revoking."
            : error === "invite_revoke_failed"
            ? "Unable to revoke invite."
            : "Something went wrong."}
        </div>
      ) : null}

      {identityUpdated === "1" ? (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          Admin display name updated.
        </div>
      ) : null}

      {cardDeleted === "1" ? (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          Card deleted.
        </div>
      ) : null}

      {inviteCreated === "1" ? (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          Invite created.
        </div>
      ) : null}

      {inviteRevoked === "1" ? (
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

      <InvitesSection
        invites={invites ?? []}
        currentFilter={inviteStatus}
        currentPage={currentInvitePage}
        pageSize={invitePageSize}
        totalCount={totalInviteCount}
        counts={inviteCounts}
      />

      <UsersSection
        users={userRows}
        actorUserId={actorUserId}
        adminCount={adminCount}
      />
    </div>
  );
}
