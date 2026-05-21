import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteUser, setUserBlocked } from "./actions";
import { getSupabaseSecretKey } from "@/lib/env";

export const dynamic = "force-dynamic";

type SearchParams = { error?: string };

export default async function AdminPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  await requireAdmin();
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

  const { data: users } = await admin
    .from("profiles")
    .select("id,email,is_blocked,created_at,cards(id,slug,full_name)")
    .order("created_at", { ascending: false })
    .limit(200);

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
        <Link
          href="/dashboard"
          className="h-10 rounded-xl border border-[var(--color-border)] px-3 text-sm font-semibold text-[var(--color-text)] inline-flex items-center"
        >
          Back to dashboard
        </Link>
      </div>

      {searchParams.error ? (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {searchParams.error === "missing_user"
            ? "Missing user id."
            : "Something went wrong."}
        </div>
      ) : null}

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
                      >
                        /card/{slug}
                      </Link>
                    </div>
                  ) : (
                    <div className="mt-1 text-xs text-[var(--color-muted)]">
                      No card
                    </div>
                  )}
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

                  <form action={deleteUser}>
                    <input type="hidden" name="user_id" value={u.id} />
                    <button className="h-9 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-700">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
