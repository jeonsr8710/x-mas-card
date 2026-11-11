/**
 * Returns true when running as the public recipient-only viewer on Vercel
 * (or when PUBLIC_VIEWER_ONLY="true" is explicitly set).
 * In this mode, card creation, sender management, and settings APIs are disabled
 * so only card viewing (/c/[slug]) and recipient replies are accessible.
 */
export function isPublicViewerOnly(): boolean {
  if (process.env.PUBLIC_VIEWER_ONLY === "true") return true;
  if (process.env.PUBLIC_VIEWER_ONLY === "false") return false;
  return process.env.VERCEL === "1";
}
