import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { getSupabasePublicConfig } from "@/lib/env";

type CookieToSet = {
  name: string;
  value: string;
  options?: CookieOptions;
};

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

function createCallbackClient(request: NextRequest) {
  const config = getSupabasePublicConfig();
  if (!config) return null;

  const cookiesToSet: CookieToSet[] = [];

  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(nextCookies: CookieToSet[]) {
        cookiesToSet.push(...nextCookies);
        nextCookies.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
      },
    },
  });

  return {
    supabase,
    applyCookies(response: NextResponse) {
      cookiesToSet.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, options);
      });
      return response;
    },
  };
}

function getRequestOrigin(request: NextRequest, fallbackUrl: URL) {
  const host =
    request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? fallbackUrl.protocol.replace(":", "");

  if (host) {
    return `${proto}://${host}`;
  }

  return fallbackUrl.origin;
}

function getCallbackLogContext(request: NextRequest, requestUrl: URL) {
  return {
    requestUrl: request.url,
    origin: requestUrl.origin,
    headerOrigin: getRequestOrigin(request, requestUrl),
    host: request.headers.get("host"),
    forwardedHost: request.headers.get("x-forwarded-host"),
    forwardedProto: request.headers.get("x-forwarded-proto"),
    referer: request.headers.get("referer"),
  };
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const requestOrigin = getRequestOrigin(request, requestUrl);
  const code = requestUrl.searchParams.get("code");
  const next = safeNextPath(requestUrl.searchParams.get("next"));

  console.log("Auth callback received", {
    hasCode: Boolean(code),
    next,
    request: getCallbackLogContext(request, requestUrl),
  });

  if (code) {
    const callbackClient = createCallbackClient(request);
    if (!callbackClient) {
      console.error("Auth callback config missing", {
        next,
        request: getCallbackLogContext(request, requestUrl),
      });
      return NextResponse.redirect(
        new URL("/auth?error=auth_callback_failed&code=config_missing", requestOrigin)
      );
    }

    const { error } =
      await callbackClient.supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const redirectTo = new URL(next, requestOrigin);
      console.log("Auth callback succeeded", {
        next,
        redirectTo: redirectTo.toString(),
        request: getCallbackLogContext(request, requestUrl),
      });

      return callbackClient.applyCookies(
        NextResponse.redirect(redirectTo)
      );
    }

    const errorCode =
      "code" in error && typeof error.code === "string" ? error.code : "";

    console.error("Auth callback failed", {
      code: errorCode,
      message: error.message,
      status: "status" in error ? error.status : undefined,
      next,
      request: getCallbackLogContext(request, requestUrl),
    });

    const errorUrl = new URL("/auth", requestOrigin);
    errorUrl.searchParams.set("error", "auth_callback_failed");
    if (errorCode) {
      errorUrl.searchParams.set("code", errorCode);
    }
    return NextResponse.redirect(errorUrl);
  }

  console.error("Auth callback missing code", {
    next,
    request: getCallbackLogContext(request, requestUrl),
  });

  return NextResponse.redirect(
    new URL("/auth?error=auth_callback_failed", requestOrigin)
  );
}
