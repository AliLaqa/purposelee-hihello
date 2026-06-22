import Link from "next/link";
import { deleteUser, deleteUserCard, setUserBlocked } from "./actions";
import AdminRefreshButton from "./admin_refresh_button";
import type { AdminUserListItem } from "./types";

type UsersSectionProps = {
  users: AdminUserListItem[];
  actorUserId: string;
};

export default function UsersSection({
  users,
  actorUserId,
}: UsersSectionProps) {
  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-xs font-semibold text-[var(--color-muted)]">
        <span>User</span>
        <AdminRefreshButton label="Users" />
      </div>
      <div className="divide-y divide-[var(--color-border)]">
        {users.map((user) => (
          <div key={user.id} className="px-4 py-3">
            <div className="min-w-0">
              <div className="mb-2 grid gap-1 text-xs text-[var(--color-muted)]">
                <div className="flex items-center gap-2">
                  <span>Status</span>
                  {user.is_blocked ? (
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
                    {user.accountType}
                  </span>
                </div>
              </div>
              <div className="truncate text-sm font-semibold text-[var(--color-text)]">
                {user.name || user.email}
              </div>
              <div className="truncate text-xs text-[var(--color-muted)]">
                {user.email}
              </div>
              {user.slug ? (
                <div className="mt-1 text-xs">
                  <Link
                    className="underline text-[var(--color-text)]"
                    href={`/card/${encodeURIComponent(user.slug)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    /card/{user.slug}
                  </Link>
                </div>
              ) : (
                <div className="mt-1 text-xs text-[var(--color-muted)]">
                  Account exists. No public card yet.
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-start gap-3">
                <form action={setUserBlocked} className="grid gap-2">
                  <input type="hidden" name="user_id" value={user.id} />
                  <input
                    type="hidden"
                    name="block"
                    value={user.is_blocked ? "0" : "1"}
                  />
                  <label className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
                    <input
                      type="checkbox"
                      name="confirm_block_action"
                      value="1"
                      required
                    />
                    {user.is_blocked ? "Confirm unblock" : "Confirm block"}
                  </label>
                  <button className="h-8 w-fit rounded-xl border border-yellow-300 bg-yellow-50 px-3 text-xs font-semibold text-yellow-700">
                    {user.is_blocked ? "Unblock User" : "Block User"}
                  </button>
                </form>

                {user.cardId ? (
                  <form action={deleteUserCard} className="grid gap-2">
                    <input type="hidden" name="user_id" value={user.id} />
                    <input type="hidden" name="card_id" value={user.cardId} />
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

                {user.id === actorUserId ? null : (
                  <form action={deleteUser} className="grid gap-2">
                    <input type="hidden" name="user_id" value={user.id} />
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
        ))}
      </div>
    </div>
  );
}
