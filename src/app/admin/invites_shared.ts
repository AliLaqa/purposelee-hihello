import type { InviteStatusFilter } from "./types";

export const DEFAULT_INVITE_STATUS_FILTER: InviteStatusFilter = "pending";
export const DEFAULT_INVITE_PAGE_SIZE = 5;
export const INVITE_PAGE_SIZE_OPTIONS = [5, 10, 20] as const;

export function getInviteStatusMeta(status: string, expiresAt: string | null) {
  const isExpired =
    status === "pending" &&
    Boolean(expiresAt) &&
    new Date(expiresAt as string).getTime() < Date.now();

  if (isExpired) {
    return { label: "expired", className: "text-amber-700", isPending: false };
  }

  if (status === "accepted") {
    return {
      label: "accepted",
      className: "text-emerald-700",
      isPending: false,
    };
  }

  if (status === "revoked") {
    return { label: "revoked", className: "text-red-700", isPending: false };
  }

  return {
    label: "pending",
    className: "text-yellow-500",
    isPending: true,
  };
}

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/+$/, "");
  return "http://localhost:3000";
}

export function getFirstSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseInviteStatusFilter(
  value: string | undefined,
): InviteStatusFilter {
  if (
    value === "pending" ||
    value === "accepted" ||
    value === "revoked" ||
    value === "expired" ||
    value === "all"
  ) {
    return value;
  }

  return DEFAULT_INVITE_STATUS_FILTER;
}

export function parsePositiveInt(
  value: string | undefined,
  fallback: number,
): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function parseInvitePageSize(value: string | undefined): number {
  const parsed = parsePositiveInt(value, DEFAULT_INVITE_PAGE_SIZE);
  return INVITE_PAGE_SIZE_OPTIONS.includes(
    parsed as (typeof INVITE_PAGE_SIZE_OPTIONS)[number],
  )
    ? parsed
    : DEFAULT_INVITE_PAGE_SIZE;
}
