export const name = 'mux-input' as const

// Caching namespace, as suspend-react might be in use by other components on the page we must ensure we don't collide
export const cacheNs = 'sanity-plugin-mux-input' as const

export const muxSecretsDocumentId = 'secrets.mux' as const
