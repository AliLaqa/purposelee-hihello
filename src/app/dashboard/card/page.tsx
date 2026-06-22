import Link from "next/link";
import { requireUser } from "@/lib/auth/guards";
import { getCardEditorErrorMessage } from "@/lib/cards/error_messages";
import { deleteMyCard, upsertCard } from "./actions";
import AvatarField from "@/components/cards/avatar_field";
import { ShareActions } from "@/components/share/share_actions";

export const dynamic = "force-dynamic";

type SearchParams = {
  error?: string;
  saved?: string;
  share?: string;
};

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
  const error = getCardEditorErrorMessage(searchParams.error);

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
          Card saved successfully.
        </div>
      ) : null}

      {error ? (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {error}
        </div>
      ) : null}

      {shareUrl ? (
        <div className="mt-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm">
          <div className="font-semibold text-[var(--color-text)]">
            Your public card is ready
          </div>
          <div className="mt-1 text-[var(--color-muted)]">
            Open it, copy the link, or share it now. You can come back later to
            update these details.
          </div>
          <div className="mt-3 break-all text-[var(--color-muted)]">
            {shareUrl}
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Link
              href={shareUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[var(--color-primary)] px-4 text-sm font-semibold text-white"
            >
              Open public card
            </Link>
            <ShareActions
              url={shareUrl}
              title={card?.full_name ? `${card.full_name} - MyHello Card` : "MyHello Card"}
              emailSubject="My MyHello digital card"
              emailBody={`Here is my MyHello digital card: ${shareUrl}`}
            />
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
