export const name = 'mux-input' as const

// Caching namespace, as suspend-react might be in use by other components on the page we must ensure we don't collide
export const cacheNs = 'sanity-plugin-mux-input' as const

export const muxSecretsDocumentId = 'secrets.mux' as const

export const DIALOGS_Z_INDEX = 60_000

export const THUMBNAIL_ASPECT_RATIO = 16 / 9

/** To prevent excessive height, thumbnails and input should not go beyond to this aspect ratio. */
export const MIN_ASPECT_RATIO = 5 / 4
