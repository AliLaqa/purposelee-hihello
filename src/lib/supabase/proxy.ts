import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicConfig } from "@/lib/env";

export async function updateSession(request: NextRequest) {
  const config = getSupabasePublicConfig();
  if (!config) {
    return NextResponse.next({ request });
  }
  const { url, publishableKey } = config;

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: Array<{
          name: string;
          value: string;
          options?: CookieOptions;
        }>,
        headers?: Record<string, string | string[]> | null
      ) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );

        supabaseResponse = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );

        if (headers) {
          Object.entries(headers).forEach(([key, value]) => {
            if (Array.isArray(value)) {
              value.forEach((v) => supabaseResponse.headers.append(key, v));
              return;
            }
            supabaseResponse.headers.set(key, value);
          });
        }
      },
    },
  });

  // IMPORTANT: This keeps auth cookies in sync and avoids random logouts.
  await supabase.auth.getClaims();

  return supabaseResponse;
}
