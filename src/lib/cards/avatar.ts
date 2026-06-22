export const AVATAR_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const AVATAR_ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;
export const AVATAR_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
export const AVATAR_ACCEPT_ATTRIBUTE = AVATAR_ALLOWED_MIME_TYPES.join(",");
export const AVATAR_ALLOWED_TYPES_LABEL = "JPG, PNG, or WebP";

export type AvatarValidationErrorCode =
  | "avatar_file_type_invalid"
  | "avatar_file_too_large";

type AvatarLike = {
  name?: string | null;
  size: number;
  type?: string | null;
};

function getFileExtension(name?: string | null) {
  if (!name || !name.includes(".")) return "";
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${Math.round((bytes / (1024 * 1024)) * 10) / 10} MB`;
  }

  return `${Math.round(bytes / 1024)} KB`;
}

export function getAvatarGuidanceText() {
  return `${AVATAR_ALLOWED_TYPES_LABEL} up to ${formatFileSize(
    AVATAR_MAX_FILE_SIZE_BYTES
  )}.`;
}

export function validateAvatarFile(
  file: AvatarLike | null | undefined
): AvatarValidationErrorCode | null {
  if (!file || file.size <= 0) {
    return null;
  }

  if (file.size > AVATAR_MAX_FILE_SIZE_BYTES) {
    return "avatar_file_too_large";
  }

  const normalizedType = String(file.type ?? "").toLowerCase();
  const extension = getFileExtension(file.name);

  const isAllowedType =
    AVATAR_ALLOWED_MIME_TYPES.includes(
      normalizedType as (typeof AVATAR_ALLOWED_MIME_TYPES)[number]
    ) ||
    AVATAR_ALLOWED_EXTENSIONS.includes(
      extension as (typeof AVATAR_ALLOWED_EXTENSIONS)[number]
    );

  return isAllowedType ? null : "avatar_file_type_invalid";
}
