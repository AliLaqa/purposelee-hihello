import Link from "next/link";
import { requireUser } from "@/lib/auth/guards";
import { signOut } from "@/app/auth/actions";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { supabase, userId } = await requireUser();

  const { data: card } = await supabase
    .from("cards")
    .select("id,slug,full_name")
    .eq("user_id", userId)
    .maybeSingle();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Create or edit your card.
          </p>
        </div>
        <form action={signOut}>
          <button className="h-10 rounded-xl border border-[var(--color-border)] px-3 text-sm font-semibold text-[var(--color-text)]">
            Sign out
          </button>
        </form>
      </div>

      <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        {card ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-[var(--color-text)]">
                {card.full_name}
              </div>
              <div className="text-sm text-[var(--color-muted)]">
                Public link:{" "}
                <Link
                  className="underline"
                  href={`/card/${encodeURIComponent(card.slug)}`}
                >
                  /card/{card.slug}
                </Link>
              </div>
            </div>
            <Link
              href="/dashboard/card"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[var(--color-primary)] px-4 text-sm font-semibold text-white"
            >
              Edit card
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-[var(--color-text)]">
                No card yet
              </div>
              <div className="text-sm text-[var(--color-muted)]">
                Create your employee card to get a public share link and QR.
              </div>
            </div>
            <Link
              href="/dashboard/card"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[var(--color-primary)] px-4 text-sm font-semibold text-white"
            >
              Create card
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
