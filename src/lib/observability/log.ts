type LogLevel = "info" | "warn" | "error";

export function log(level: LogLevel, message: string, meta?: unknown) {
  const payload = {
    level,
    message,
    meta: meta ?? null,
    ts: new Date().toISOString(),
  };

  // Vercel will capture stdout/stderr; keep logs structured.
  if (level === "error") {
    console.error(JSON.stringify(payload));
    return;
  }
  if (level === "warn") {
    console.warn(JSON.stringify(payload));
    return;
  }
  console.log(JSON.stringify(payload));
}

export const logInfo = (message: string, meta?: unknown) =>
  log("info", message, meta);
export const logWarn = (message: string, meta?: unknown) =>
  log("warn", message, meta);
export const logError = (message: string, meta?: unknown) =>
  log("error", message, meta);

