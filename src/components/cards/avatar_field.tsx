"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  initialUrl?: string | null;
};

export default function AvatarField({ initialUrl }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const previewUrl = useMemo(() => {
    if (!selectedFile) return null;
    return URL.createObjectURL(selectedFile);
  }, [selectedFile]);

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const shownUrl = previewUrl || initialUrl || null;

  return (
    <label className="grid gap-1 sm:col-span-2">
      <span className="text-xs font-medium text-[var(--color-muted)]">
        Photo / Logo
      </span>
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]">
          {shownUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shownUrl}
              alt="Avatar"
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>
        <input
          type="file"
          name="avatar"
          accept="image/*"
          className="text-sm"
          onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
        />
      </div>
    </label>
  );
}

