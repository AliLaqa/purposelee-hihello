import Link from "next/link";
import { requireUser } from "@/lib/auth/guards";
import { deleteMyCard, upsertCard } from "./actions";
import AvatarField from "@/components/cards/avatar_field";

export const dynamic = "force-dynamic";

type SearchParams = {
  error?: string;
  code?: string;
  saved?: string;
  share?: string;
};

function errorMessage(code?: string) {
  if (!code) return null;
  switch (code) {
    case "missing_fields":
      return "All fields are required.";
    case "invalid_slug":
      return "Slug can only contain letters, numbers, and hyphens.";
    case "slug_taken":
      return "That slug is already taken. Choose another.";
    case "avatar_upload_failed":
      return "Avatar upload failed. Try again.";
    case "delete_confirm_required":
      return "Confirm card deletion before deleting.";
    case "delete_failed":
      return "Unable to delete card. Try again.";
    case "save_failed":
    default:
      return "Unable to save. Try again.";
  }
}

export default async function CardEditorPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const { supabase, userId } = await requireUser();
  const searchParams = await props.searchParams;

  const { data: card } = await supabase
    .from("cards")
    .select("id,slug,full_name,company,email,phone,avatar_path")
    .eq("user_id", userId)
    .maybeSingle();

  const { data: avatarUrlData } = card?.avatar_path
    ? supabase.storage.from("avatars").getPublicUrl(card.avatar_path)
    : { data: { publicUrl: null } };

  const shareUrl = searchParams.share;
  const saved = searchParams.saved === "1";
  const error = errorMessage(searchParams.error);
  const errorCode = searchParams.code;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">
            Employee card
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Update your details and upload your photo/logo.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="h-10 rounded-xl border border-[var(--color-border)] px-3 text-sm font-semibold text-[var(--color-text)] inline-flex items-center"
        >
          Back
        </Link>
      </div>

      {saved ? (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          Saved.
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {error}
          {errorCode ? (
            <div className="mt-1 text-xs opacity-80">
              Code: <code className="font-mono">{errorCode}</code>
            </div>
          ) : null}
        </div>
      ) : null}

      {shareUrl ? (
        <div className="mt-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm">
          <div className="font-semibold text-[var(--color-text)]">
            Share link
          </div>
          <div className="mt-1 break-all text-[var(--color-muted)]">
            {shareUrl}
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Link
              href={shareUrl}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[var(--color-primary)] px-4 text-sm font-semibold text-white"
            >
              Open public card
            </Link>
          </div>
        </div>
      ) : null}

      <form
        action={upsertCard}
        className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <AvatarField initialUrl={avatarUrlData?.publicUrl ?? null} />

          <label className="grid gap-1">
            <span className="text-xs font-medium text-[var(--color-muted)]">
              Full name
            </span>
            <input
              name="full_name"
              defaultValue={card?.full_name ?? ""}
              required
              className="h-11 rounded-xl border border-[var(--color-border)] bg-transparent px-3 text-sm text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-medium text-[var(--color-muted)]">
              Company
            </span>
            <input
              name="company"
              defaultValue={card?.company ?? ""}
              required
              className="h-11 rounded-xl border border-[var(--color-border)] bg-transparent px-3 text-sm text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-medium text-[var(--color-muted)]">
              Email
            </span>
            <input
              name="email"
              type="email"
              defaultValue={card?.email ?? ""}
              required
              className="h-11 rounded-xl border border-[var(--color-border)] bg-transparent px-3 text-sm text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-medium text-[var(--color-muted)]">
              Phone
            </span>
            <input
              name="phone"
              defaultValue={card?.phone ?? ""}
              required
              className="h-11 rounded-xl border border-[var(--color-border)] bg-transparent px-3 text-sm text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </label>

          <label className="grid gap-1 sm:col-span-2">
            <span className="text-xs font-medium text-[var(--color-muted)]">
              Slug (public URL)
            </span>
            <input
              name="slug"
              defaultValue={card?.slug ?? ""}
              placeholder="e.g. john-doe"
              className="h-11 rounded-xl border border-[var(--color-border)] bg-transparent px-3 text-sm text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
            <span className="text-xs text-[var(--color-muted)]">
              Your card will be available at{" "}
              <code className="font-mono">/card/&lt;slug&gt;</code>.
            </span>
          </label>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button className="h-11 rounded-xl bg-[var(--color-primary)] px-4 text-sm font-semibold text-white">
            Save
          </button>
          {card?.slug ? (
            <Link
              href={`/card/${encodeURIComponent(card.slug)}`}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--color-border)] px-4 text-sm font-semibold text-[var(--color-text)]"
            >
              View public card
            </Link>
          ) : null}
        </div>
      </form>

      {card ? (
        <form
          action={deleteMyCard}
          className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6"
        >
          <h2 className="text-sm font-semibold text-red-900">Delete card</h2>
          <p className="mt-1 text-sm text-red-800">
            This removes your public card and its current avatar file. Your
            account stays active.
          </p>
          <label className="mt-4 flex items-center gap-2 text-sm font-medium text-red-900">
            <input
              type="checkbox"
              name="confirm_delete"
              value="1"
              required
            />
            I understand this card will be deleted.
          </label>
          <button className="mt-4 h-10 rounded-xl border border-red-300 bg-white px-4 text-sm font-semibold text-red-700">
            Delete my card
          </button>
        </form>
      ) : null}
    </div>
  );
}
