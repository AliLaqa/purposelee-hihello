"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

type Props = {
  label: string;
};

export default function AdminRefreshButton({ label }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function refresh() {
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={refresh}
      disabled={isPending}
      aria-label={`Refresh ${label}`}
      title={`Refresh ${label}`}
      className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--color-border)] text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`}
        aria-hidden="true"
      >
        <path d="M21 12a9 9 0 1 1-2.64-6.36" />
        <path d="M21 3v6h-6" />
      </svg>
    </button>
  );
}
