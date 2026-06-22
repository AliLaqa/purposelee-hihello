import { getSupabasePublicConfig } from "@/lib/env";
import {
  AuthSearchParams,
  AuthShell,
  AuthStatusBanners,
  getFirstParam,
  InviteSignUpForm,
} from "../auth_shared";

export const dynamic = "force-dynamic";

export default async function SignUpPage(props: {
  searchParams: Promise<AuthSearchParams>;
}) {
  const searchParams = await props.searchParams;
  const error = getFirstParam(searchParams.error);
  const code = getFirstParam(searchParams.code);
  const inviteToken = getFirstParam(searchParams.invite) ?? "";
  const isSupabaseConfigured = Boolean(getSupabasePublicConfig());

  return (
    <AuthShell
      title="Create account"
      description="Create your MyHello account from an admin invite."
    >
      <AuthStatusBanners
        error={error}
        code={code}
        isSupabaseConfigured={isSupabaseConfigured}
        hiddenErrors={["invalid_invite"]}
      />
      <InviteSignUpForm
        inviteToken={inviteToken}
        isSupabaseConfigured={isSupabaseConfigured}
        error={error}
        code={code}
      />
    </AuthShell>
  );
}
