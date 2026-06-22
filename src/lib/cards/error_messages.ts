export function getCardEditorErrorMessage(code?: string) {
  if (!code) return null;

  switch (code) {
    case "missing_fields":
      return "Please fill in all fields before saving.";
    case "invalid_slug":
      return "Use only letters, numbers, and hyphens in your public link.";
    case "slug_taken":
      return "That public link is already in use. Try a different one.";
    case "avatar_file_type_invalid":
      return "Please upload a JPG, PNG, or WebP image.";
    case "avatar_file_too_large":
      return "Please upload an image that is 5 MB or smaller.";
    case "avatar_upload_failed":
      return "We couldn't upload your image, so your card was not updated. Please try again.";
    case "delete_confirm_required":
      return "Tick the box before deleting your card.";
    case "delete_failed":
      return "We couldn't delete your card. Please try again.";
    case "save_failed":
    default:
      return "We couldn't save your card. Please try again.";
  }
}
