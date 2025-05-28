/**
 * Utility functions for handling React Flow handle IDs
 * React Flow has issues with spaces and special characters in handle IDs,
 * so we need to sanitize them while keeping the original display names.
 */

/**
 * Convert a display name to a safe handle ID for React Flow
 * @param name - The original display name (e.g., "Execute Condition")
 * @returns Sanitized handle ID (e.g., "execute-condition")
 */
export function sanitizeHandleId(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')  // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, '')  // Remove special characters except hyphens
    .replace(/-+/g, '-')  // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, '');  // Remove leading/trailing hyphens
}

/**
 * Create a mapping from sanitized handle IDs back to original names
 * @param names - Array of original display names
 * @returns Object mapping sanitized IDs to original names
 */
export function createHandleMapping(names: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  names.forEach(name => {
    mapping[sanitizeHandleId(name)] = name;
  });
  return mapping;
}

/**
 * Get the original name from a sanitized handle ID
 * @param handleId - Sanitized handle ID
 * @param mapping - Mapping from sanitized IDs to original names
 * @returns Original display name or the handle ID if not found
 */
export function getOriginalName(handleId: string, mapping: Record<string, string>): string {
  return mapping[handleId] || handleId;
}


