export const name = 'sanity-plugin-mux-input' as const

// Caching namespace, as suspend-react might be in use by other components on the page we must ensure we don't collide
// @TODO rename
export const cacheNs = name

export const muxSecretsDocumentId = 'secrets.mux' as const
