"use client";

import { useEffect } from "react";
import { captureExceptionClient } from "@/lib/observability/sentry_client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureExceptionClient(error, { digest: error.digest });
  }, [error]);

  return (
    <html>
      <body className="min-h-full flex flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
        <div className="mx-auto w-full max-w-lg px-4 py-16">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <h1 className="text-lg font-semibold">Something went wrong</h1>
            <p className="mt-2 text-sm text-[var(--color-muted)]">
              Please try again.
            </p>
            <button
              onClick={reset}
              className="mt-4 h-10 rounded-xl bg-[var(--color-primary)] px-4 text-sm font-semibold text-white"
            >
              Retry
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
