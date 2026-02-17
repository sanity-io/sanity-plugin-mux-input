import {mimeToExt} from "./mimeExtGraph"

/**
 * This function triggers a browser download for a remote file.
 * @param url The target remote file URL.
 * @param name The name of the downloaded file.
 */
export async function downloadFile(url: string, name = 'untitled', extension = ''): Promise<void> {

    if (typeof window === 'undefined') // Should never happen here.
        throw new Error('downloadFile() can only be called in a browser environment.')

    const response = await fetch(url, { mode: 'cors' })
    if (!response.ok)
        throw new Error(`downloadFile() failed to fetch file: ${response.status} ${response.statusText}`)

    // Precedence: Provided extension > mimeExtGraph.ts > 'Content-Disposition' header.
    const mime = response.headers.get('Content-Type') ?? ''
    let fileExt = extension.trim() || mimeToExt(mime) || ''
    if (fileExt) fileExt = `.${fileExt}`

    let fileName = name.trim() || 'untitled'
    if (fileExt.length && !fileName.endsWith(fileExt))
        fileName += fileExt

    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)

    try {
        const anchor = document.createElement('a')
        anchor.download = fileName
        anchor.href = objectUrl
        document.body.appendChild(anchor)
        anchor.click()
        document.body.removeChild(anchor)

    } finally {
        URL.revokeObjectURL(objectUrl)
    }
}