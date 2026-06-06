/**
 * Strictly sanitizes and normalizes a file path to prevent directory traversal
 * and root-level destructive operations.
 *
 * @param path The input path to sanitize
 * @param allowEmpty Whether to allow the root directory (empty path).
 *                   This should be true ONLY for safe operations like listing files,
 *                   and explicitly FALSE for destructive operations like delete/write.
 */
export function sanitizePath(path: string, allowEmpty: boolean = false): string | null {
  if (typeof path !== "string") return null;

  let decoded = path;
  try {
    decoded = decodeURIComponent(path);
  } catch (e) {
    return null;
  }

  // Normalize slashes and remove leading/trailing spaces/slashes
  let normalized = decoded.replace(/\\/g, "/").trim();
  normalized = normalized.replace(/^\/+/, "");

  // Check for traversal or invalid characters
  if (normalized.includes("..") || /[<>:"|?*]/.test(normalized)) {
    return null;
  }

  // If path becomes empty after stripping leading slashes, reject if not allowed
  if (normalized === "" && !allowEmpty) {
    return null;
  }

  return normalized;
}
