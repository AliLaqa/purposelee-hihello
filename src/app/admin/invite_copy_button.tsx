"use client";

import { useState } from "react";

type Props = {
  url: string;
};

export default function InviteCopyButton({ url }: Props) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">(
    "idle"
  );

  async function copy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        setCopyStatus("copied");
        setTimeout(() => setCopyStatus("idle"), 1200);
        return;
      }

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
  }

  const buttonClassName =
    copyStatus === "copied"
      ? "h-8 rounded-xl border border-emerald-300 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700"
      : copyStatus === "failed"
      ? "h-8 rounded-xl border border-red-300 bg-red-50 px-3 text-xs font-semibold text-red-700"
      : "h-8 rounded-xl border border-sky-300 bg-sky-50 px-3 text-xs font-semibold text-sky-700";

  return (
    <button
      type="button"
      onClick={copy}
      className={buttonClassName}
    >
      {copyStatus === "copied"
        ? "Copied"
        : copyStatus === "failed"
        ? "Copy failed"
        : "Copy invite link"}
    </button>
  );
}
