"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AVATAR_ACCEPT_ATTRIBUTE,
  getAvatarGuidanceText,
  validateAvatarFile,
} from "@/lib/cards/avatar";

type Props = {
  initialUrl?: string | null;
};

export default function AvatarField({ initialUrl }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const previewUrl = useMemo(() => {
    if (!selectedFile) return null;
    return URL.createObjectURL(selectedFile);
  }, [selectedFile]);

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const shownUrl = previewUrl || initialUrl || null;
  const guidanceText = getAvatarGuidanceText();

  function handleChange(file: File | null) {
    const validationError = validateAvatarFile(file);

    if (validationError === "avatar_file_too_large") {
      setSelectedFile(null);
      setErrorMessage(`Image is too large. Upload ${guidanceText}`);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      return;
    }

    if (validationError === "avatar_file_type_invalid") {
      setSelectedFile(null);
      setErrorMessage(`Unsupported image type. Upload ${guidanceText}`);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
  }

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
          ref={inputRef}
          type="file"
          name="avatar"
          accept={AVATAR_ACCEPT_ATTRIBUTE}
          className="text-sm"
          onChange={(e) => handleChange(e.target.files?.[0] ?? null)}
        />
      </div>
      <span className="text-xs text-[var(--color-muted)]">{guidanceText}</span>
      {errorMessage ? (
        <span className="text-xs text-red-700">{errorMessage}</span>
      ) : null}
    </label>
  );
}
