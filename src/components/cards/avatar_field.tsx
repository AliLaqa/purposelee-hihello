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
  const [markedForRemoval, setMarkedForRemoval] = useState(false);

  const previewUrl = useMemo(() => {
    if (!selectedFile) return null;
    return URL.createObjectURL(selectedFile);
  }, [selectedFile]);

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const shownUrl = previewUrl || (markedForRemoval ? null : initialUrl) || null;
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
    setMarkedForRemoval(false);
    setSelectedFile(file);
  }

  function handleRemove() {
    if (inputRef.current) {
      inputRef.current.value = "";
    }

    setErrorMessage(null);

    if (selectedFile) {
      setSelectedFile(null);
      setMarkedForRemoval(Boolean(initialUrl));
      return;
    }

    if (initialUrl) {
      setMarkedForRemoval(true);
    }
  }

  return (
    <label className="grid gap-4 sm:col-span-2">
      <span className="text-xs font-medium text-[var(--color-muted)]">
        Photo / Logo
      </span>
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
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
          {shownUrl ? (
            <button
              type="button"
              aria-label="Remove image"
              onClick={handleRemove}
              className="absolute -right-2 -top-2 inline-flex h-6 w-6 items-center justify-center rounded-full border border-red-300/60 bg-transparent text-xs font-semibold leading-none text-red-500 transition-colors hover:bg-red-600 hover:text-white focus-visible:bg-red-600 focus-visible:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/70"
            >
              x
            </button>
          ) : null}
        </div>
        <div className="min-w-0 flex-1 grid gap-1">
          <input
            ref={inputRef}
            type="file"
            name="avatar"
            accept={AVATAR_ACCEPT_ATTRIBUTE}
            className="text-sm"
            onChange={(e) => handleChange(e.target.files?.[0] ?? null)}
          />
          {selectedFile ? (
            <span className="truncate text-xs text-[var(--color-muted)]">
              {selectedFile.name}
            </span>
          ) : null}
        </div>
      </div>
      <input
        type="hidden"
        name="remove_avatar"
        value={markedForRemoval && !selectedFile ? "1" : "0"}
      />
      <span className="text-xs text-[var(--color-muted)]">{guidanceText}</span>
      {markedForRemoval ? (
        <span className="text-xs text-[var(--color-muted)]">
          Image will be removed when you save.
        </span>
      ) : null}
      {errorMessage ? (
        <span className="text-xs text-red-700">{errorMessage}</span>
      ) : null}
    </label>
  );
}
