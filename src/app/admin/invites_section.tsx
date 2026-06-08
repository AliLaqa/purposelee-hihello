import Link from "next/link";
import { createInvite, revokeInvite } from "./actions";
import AdminRefreshButton from "./admin_refresh_button";
import InviteCopyButton from "./invite_copy_button";
import {
  DEFAULT_INVITE_PAGE_SIZE,
  DEFAULT_INVITE_STATUS_FILTER,
  getInviteStatusMeta,
  getSiteUrl,
  INVITE_PAGE_SIZE_OPTIONS,
} from "./invites_shared";
import type {
  InviteListItem,
  InviteStatusCounts,
  InviteStatusFilter,
} from "./types";

type InvitesSectionProps = {
  invites: InviteListItem[];
  currentFilter: InviteStatusFilter;
  currentPage: number;
  pageSize: number;
  totalCount: number;
  counts: InviteStatusCounts;
};

const FILTER_OPTIONS: Array<{
  key: InviteStatusFilter;
  label: string;
}> = [
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Accepted" },
  { key: "revoked", label: "Revoked" },
  { key: "expired", label: "Expired" },
  { key: "all", label: "All" },
];

function buildInviteHref(options: {
  filter: InviteStatusFilter;
  pageSize: number;
  page: number;
}) {
  const params = new URLSearchParams();

  if (options.filter !== DEFAULT_INVITE_STATUS_FILTER) {
    params.set("inviteStatus", options.filter);
  }

  if (options.pageSize !== DEFAULT_INVITE_PAGE_SIZE) {
    params.set("invitePageSize", String(options.pageSize));
  }

  if (options.page > 1) {
    params.set("invitePage", String(options.page));
  }

  const query = params.toString();
  return query ? `/admin?${query}` : "/admin";
}

export default function InvitesSection({
  invites,
  currentFilter,
  currentPage,
  pageSize,
  totalCount,
  counts,
}: InvitesSectionProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const showFrom = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const showTo = totalCount === 0 ? 0 : Math.min(currentPage * pageSize, totalCount);

  return (
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

      <div className="mt-4 grid gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((option) => {
            const isActive = option.key === currentFilter;

            return (
              <Link
                key={option.key}
                href={buildInviteHref({
                  filter: option.key,
                  pageSize,
                  page: 1,
                })}
                className={`inline-flex h-9 items-center rounded-lg border px-3 text-xs font-semibold ${
                  isActive
                    ? "border-[var(--color-primary)] bg-[var(--color-surface)] text-[var(--color-text)]"
                    : "border-[var(--color-border)] text-[var(--color-muted)]"
                }`}
              >
                {option.label} ({counts[option.key]})
              </Link>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--color-muted)]">
          <div>
            Showing {showFrom}-{showTo} of {totalCount}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span>Per page</span>
            {INVITE_PAGE_SIZE_OPTIONS.map((size) => {
              const isActive = size === pageSize;
              return (
                <Link
                  key={size}
                  href={buildInviteHref({
                    filter: currentFilter,
                    pageSize: size,
                    page: 1,
                  })}
                  className={`inline-flex h-8 items-center rounded-lg border px-3 text-xs font-semibold ${
                    isActive
                      ? "border-[var(--color-primary)] bg-[var(--color-surface)] text-[var(--color-text)]"
                      : "border-[var(--color-border)] text-[var(--color-muted)]"
                  }`}
                >
                  {size}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {invites.map((invite) => {
          const inviteUrl = `${getSiteUrl()}/auth?invite=${encodeURIComponent(
            invite.token,
          )}`;
          const inviteStatus = getInviteStatusMeta(
            invite.status,
            invite.expires_at ?? null,
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
                  Status: <span className={inviteStatus.className}>{inviteStatus.label}</span>
                  {invite.expires_at
                    ? ` · Expires: ${new Date(invite.expires_at).toLocaleDateString()}`
                    : ""}
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

        {invites.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--color-border)] p-4 text-sm text-[var(--color-muted)]">
            No {currentFilter === "all" ? "" : `${currentFilter} `}invites found.
          </div>
        ) : null}
      </div>

      {totalCount > 0 ? (
        <div className="mt-4 flex items-center justify-between gap-3 text-sm">
          {currentPage > 1 ? (
            <Link
              href={buildInviteHref({
                filter: currentFilter,
                pageSize,
                page: currentPage - 1,
              })}
              className="inline-flex h-9 items-center rounded-lg border border-[var(--color-border)] px-3 font-semibold text-[var(--color-text)]"
            >
              Previous
            </Link>
          ) : (
            <span className="inline-flex h-9 items-center rounded-lg border border-[var(--color-border)] px-3 font-semibold text-[var(--color-muted)] opacity-60">
              Previous
            </span>
          )}

          <span className="text-xs text-[var(--color-muted)]">
            Page {currentPage} of {totalPages}
          </span>

          {currentPage < totalPages ? (
            <Link
              href={buildInviteHref({
                filter: currentFilter,
                pageSize,
                page: currentPage + 1,
              })}
              className="inline-flex h-9 items-center rounded-lg border border-[var(--color-border)] px-3 font-semibold text-[var(--color-text)]"
            >
              Next
            </Link>
          ) : (
            <span className="inline-flex h-9 items-center rounded-lg border border-[var(--color-border)] px-3 font-semibold text-[var(--color-muted)] opacity-60">
              Next
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
}
