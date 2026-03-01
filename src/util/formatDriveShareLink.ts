/**
 * Format Google Drive share links as Google Drive export links.
 * Supported formats:
 *  - https://drive.google.com/uc?id=<ID>...
 *  - https://drive.google.com/open?id=<ID>...
 *  - https://drive.google.com/file/d/<ID>...
 *  - https://drive.google.com/folder/<ID>...
 * 
 * @param url Google Drive share link to format.
 * @returns Google Drive export link (URL passthrough if not share link).
 */
export function formatDriveShareLink(url: string): string {

  // Export link formatter.
  const formatExportLink = (id: string) => {
    return `https://drive.google.com/uc?export=download&id=${id}`
  }

  // URL formatting.
  try {

    // Parse URL.
    const trimmed = url.trim()
    const parsed = new URL(trimmed)

    // Enforce strict host name.
    if (parsed.hostname !== "drive.google.com") {
      throw new Error("URL is not from Google Drive.")
    }

    // Look for ID in search parameters.
    const id = parsed.searchParams.get("id") || ""
    if (id.length) {
      return formatExportLink(id)
    }

    // Look for ID in path name.
    const path = parsed.pathname.split("/") || []

    // Path is /file/d/<ID>...
    if (path.includes("file") && path.includes("d")) {
      const index = path.findIndex((value: string) => { return value === "d" }) + 1
      const id = path.at(index) || ""
      return formatExportLink(id)
    }

    // Path is /folder/<ID>...
    if (path.includes("folders")) {
      const index = path.findIndex((value: string) => { return value === "folders" }) + 1
      const id = path.at(index) || ""
      return formatExportLink(id)
    }

    // URL not recognized.
    throw new Error("URL was not recognized.")

  } catch {

    // URL passthrough by default.
    return url
  }
}