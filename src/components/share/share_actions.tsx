"use client";

import type { MouseEvent } from "react";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";

type Props = {
  url: string;
  title?: string;
  emailSubject?: string;
  emailBody?: string;
};

export function ShareActions({
  url,
  title = "MyHello Card",
  emailSubject = "My digital card",
  emailBody,
}: Props) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">(
    "idle"
  );

  const canShare = useSyncExternalStore(
    () => () => {},
    () => typeof navigator !== "undefined" && typeof navigator.share === "function",
    () => false
  );

  const mailto = useMemo(() => {
    const subject = encodeURIComponent(emailSubject);
    const body = encodeURIComponent(emailBody ?? `Here's my card: ${url}`);
    return `mailto:?subject=${subject}&body=${body}`;
  }, [emailBody, emailSubject, url]);

  const copy = useCallback(async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setCopyStatus("copied");
        setTimeout(() => setCopyStatus("idle"), 1200);
        return;
      }

      // Fallback for insecure contexts / older browsers.
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.setAttribute("readonly", "true");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);

      if (!ok) {
        window.prompt("Copy this link:", url);
      }

      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 1200);
    } catch {
      setCopyStatus("failed");
      setTimeout(() => setCopyStatus("idle"), 1500);
    }
  }, [url]);

  const webShare = useCallback(async () => {
    if (!navigator.share) return;
    await navigator.share({ title, url });
  }, [title, url]);

  const handleEmailShareClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      console.log("Email share clicked", {
        mailto,
        url,
        defaultPrevented: event.defaultPrevented,
        button: event.button,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
        altKey: event.altKey,
        userAgent: navigator.userAgent,
        visibilityState: document.visibilityState,
        hasFocus: document.hasFocus(),
      });

      window.setTimeout(() => {
        console.log("Email share post-click state", {
          mailto,
          visibilityState: document.visibilityState,
          hasFocus: document.hasFocus(),
          activeElement:
            document.activeElement instanceof HTMLElement
              ? document.activeElement.tagName
              : null,
        });
      }, 500);
    },
    [mailto, url]
  );

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <button
        type="button"
        onClick={copy}
        className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--color-border)] px-4 text-sm font-semibold text-[var(--color-text)]"
      >
        {copyStatus === "copied"
          ? "Copied"
          : copyStatus === "failed"
          ? "Copy failed"
          : "Copy link"}
      </button>

      {canShare ? (
        <button
          type="button"
          onClick={webShare}
          className="inline-flex h-10 items-center justify-center rounded-xl bg-[var(--color-primary)] px-4 text-sm font-semibold text-white"
        >
          Share
        </button>
      ) : null}

      <a
        href={mailto}
        onClick={handleEmailShareClick}
        className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--color-border)] px-4 text-sm font-semibold text-[var(--color-text)]"
      >
        Share by email
      </a>
    </div>
  );
}
