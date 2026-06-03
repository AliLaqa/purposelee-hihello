import type { Metadata } from "next";
import Link from "next/link";
import QRCode from "react-qr-code";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicConfig } from "@/lib/env";
import { ShareActions } from "@/components/share/share_actions";

export const dynamic = "force-dynamic";

function getBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/+$/, "");
  return "http://localhost:3000";
}

type PublicCardPageProps = {
  params: Promise<{ slug: string }>;
};

async function getPublicCard(slug: string) {
  if (!getSupabasePublicConfig()) {
    return null;
  }

  const supabase = await createClient();
  const { data: card } = await supabase
    .from("cards")
    .select("slug,full_name,company,email,phone,avatar_path")
    .eq("slug", slug)
    .maybeSingle();

  if (!card) {
    return null;
  }

  const { data: avatarUrlData } = card.avatar_path
    ? supabase.storage.from("avatars").getPublicUrl(card.avatar_path)
    : { data: { publicUrl: null } };

  return { card, avatarUrl: avatarUrlData?.publicUrl ?? null };
}

export async function generateMetadata({
  params,
}: PublicCardPageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getPublicCard(slug);

  if (!result) {
    return {
      title: "Card not found | MyHello",
      description: "This MyHello card is unavailable.",
    };
  }

  const { card, avatarUrl } = result;
  const url = `${getBaseUrl()}/card/${encodeURIComponent(card.slug)}`;
  const title = `${card.full_name} - ${card.company}`;
  const description = `Digital business card for ${card.full_name} at ${card.company}.`;
  const images = avatarUrl
    ? [{ url: avatarUrl, alt: `${card.full_name} photo` }]
    : undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "MyHello",
      type: "profile",
      images,
    },
    twitter: {
      card: avatarUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: avatarUrl ? [avatarUrl] : undefined,
    },
  };
}

export default async function PublicCardPage(props: PublicCardPageProps) {
  const { slug } = await props.params;

  if (!getSupabasePublicConfig()) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-16">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h1 className="text-lg font-semibold text-[var(--color-text)]">
            Not configured
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Supabase is not configured for this deployment.
          </p>
          <div className="mt-4">
            <Link className="underline" href="/">
              Go home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const result = await getPublicCard(slug);

  if (!result) {
    notFound();
  }

  const { card, avatarUrl } = result;

  const url = `${getBaseUrl()}/card/${encodeURIComponent(card.slug)}`;
  const vcardUrl = `/card/${encodeURIComponent(card.slug)}/vcard`;

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-10">
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="h-16 w-16 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)]">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={card.full_name}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-semibold text-[var(--color-text)]">
              {card.full_name}
            </h1>
            <div className="mt-1 text-sm text-[var(--color-muted)]">
              {card.company}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-2 text-sm">
          <a
            href={`mailto:${card.email}`}
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-[var(--color-text)]"
          >
            {card.email}
          </a>
          <a
            href={`tel:${card.phone}`}
            className="rounded-xl border border-[var(--color-border)] px-3 py-2 text-[var(--color-text)]"
          >
            {card.phone}
          </a>
        </div>

        <div className="mt-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg)] p-4">
          <div className="text-xs font-medium text-[var(--color-muted)]">
            QR code
          </div>
          <div className="mt-3 flex justify-center">
            <div className="rounded-xl bg-white p-3">
              <QRCode value={url} size={180} />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <ShareActions url={url} title={`${card.full_name} - MyHello`} />
        </div>

        <div className="mt-4">
          <a
            href={vcardUrl}
            className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-[var(--color-border)] px-4 text-sm font-semibold text-[var(--color-text)]"
          >
            Save contact (vCard)
          </a>
        </div>
      </div>
    </div>
  );
}
