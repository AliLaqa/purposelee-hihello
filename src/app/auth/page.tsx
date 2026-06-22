import { redirect } from "next/navigation";
import { AuthSearchParams, getFirstParam } from "./auth_shared";

export const dynamic = "force-dynamic";

const SIGN_UP_ERRORS = new Set([
  "invite_required",
  "invalid_invite",
  "invite_check_unavailable",
  "signup_failed",
]);

function buildRedirectPath(
  target: "/auth/sign-in" | "/auth/sign-up",
  searchParams: AuthSearchParams,
) {
  const params = new URLSearchParams();

  for (const [key, rawValue] of Object.entries(searchParams)) {
    if (rawValue === undefined) continue;
    const values = Array.isArray(rawValue) ? rawValue : [rawValue];

    for (const value of values) {
      params.append(key, value);
    }
  }

  const query = params.toString();
  return query ? `${target}?${query}` : target;
}

export default async function AuthPage(props: {
  searchParams: Promise<AuthSearchParams>;
}) {
  const searchParams = await props.searchParams;
  const inviteToken = getFirstParam(searchParams.invite);
  const error = getFirstParam(searchParams.error);

  if (inviteToken || (error && SIGN_UP_ERRORS.has(error))) {
    redirect(buildRedirectPath("/auth/sign-up", searchParams));
  }

  redirect(buildRedirectPath("/auth/sign-in", searchParams));
}
