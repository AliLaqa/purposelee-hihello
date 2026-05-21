import * as Sentry from "@sentry/browser";
import { logError } from "./log";

let inited = false;

function init() {
  if (inited) return;
  inited = true;

  const dsn = process.env.SENTRY_DSN || "";
  if (!dsn) return;

  Sentry.init({
    dsn,
    tracesSampleRate: 0,
  });
}

export function captureExceptionClient(error: unknown, context?: unknown) {
  try {
    init();
    if (!process.env.SENTRY_DSN) {
      logError("Unhandled client exception (no SENTRY_DSN set)", {
        error,
        context,
      });
      return;
    }
    Sentry.captureException(error, { extra: { context } });
  } catch (e) {
    logError("Failed to capture client exception", { error, captureError: e });
  }
}

