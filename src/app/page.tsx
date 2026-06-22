import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicConfig } from "@/lib/env";

export const dynamic = "force-dynamic";

export default function Home() {
  return <HomeServer />;
}

async function HomeServer() {
  if (getSupabasePublicConfig()) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();

    if (data?.claims?.sub) {
      redirect("/dashboard");
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text)]">
          MyHello
        </h1>
        {getSupabasePublicConfig() ? (
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Create a simple digital employee card and share it with a public
            link and QR code.
          </p>
        ) : (
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Supabase is not configured yet. Set{" "}
            <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code className="font-mono">
              NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
            </code>{" "}
            in <code className="font-mono">.env.local</code>.
          </p>
        )}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/auth/sign-in"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--color-primary)] px-4 text-sm font-semibold text-white"
          >
            Sign in
          </Link>
          <Link
            href="/auth/sign-up"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--color-border)] px-4 text-sm font-semibold text-[var(--color-text)]"
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
