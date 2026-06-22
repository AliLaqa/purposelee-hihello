import { getSupabasePublicConfig } from "@/lib/env";
import {
  AuthSearchParams,
  AuthShell,
  AuthStatusBanners,
  getFirstParam,
  SignInForm,
} from "../auth_shared";

export const dynamic = "force-dynamic";

export default async function SignInPage(props: {
  searchParams: Promise<AuthSearchParams>;
}) {
  const searchParams = await props.searchParams;
  const error = getFirstParam(searchParams.error);
  const blocked = getFirstParam(searchParams.blocked) === "1";
  const code = getFirstParam(searchParams.code);
  const passwordReset = getFirstParam(searchParams.password_reset) === "1";
  const isSupabaseConfigured = Boolean(getSupabasePublicConfig());

  return (
    <AuthShell
      title="MyHello"
      description="Sign in to create and share your digital card."
    >
      <AuthStatusBanners
        error={error}
        blocked={blocked}
        code={code}
        isSupabaseConfigured={isSupabaseConfigured}
        passwordReset={passwordReset}
      />
      <SignInForm isSupabaseConfigured={isSupabaseConfigured} />
    </AuthShell>
  );
}
