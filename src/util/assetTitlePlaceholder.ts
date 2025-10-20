import {truncateString} from 'sanity'

/**
 * Generates a placeholder title for a Mux asset when no title is available.
 * This format is used when importing assets that don't have a title in Mux.
 *
 * @param assetId - The Mux asset ID
 * @returns A placeholder title in the format "Asset #[truncated-id]"
 */
export function generateAssetPlaceholder(assetId: string): string {
  return `Asset #${truncateString(assetId, 15)}`
}

/**
 * Checks if a filename is empty or has the placeholder format.
 * This is used to determine if a video title should be updated during metadata sync.
 *
 * @param filename - The current filename/title of the video
 * @param assetId - The Mux asset ID to check against
 * @returns true if the filename is empty or matches the placeholder format
 */
export function isEmptyOrPlaceholderTitle(filename: string | undefined, assetId: string): boolean {
  // Check if filename is empty/undefined
  if (!filename || filename.trim() === '') {
    return true
  }

  // Check if filename matches the placeholder format for this asset
  const placeholder = generateAssetPlaceholder(assetId)
  return filename === placeholder
}
