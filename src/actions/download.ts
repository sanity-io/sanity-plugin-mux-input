import type {SanityClient} from 'sanity'

import {getAsset, updateMasterAccess} from './assets'
import {testSecrets} from './secrets'

/**
 * This function enables master access on a remote mux asset.
 * @param client Sanity client (uses addon credentials).
 * @param assetId The target mux asset ID.
 * @return Return true on success.
 */
export async function enableMasterAccess(
    client: SanityClient,
    assetId: string
): Promise<boolean> {
    try {
        const secretsValid = await testSecrets(client)
        if (!secretsValid?.status) return false

        await updateMasterAccess(client, assetId, 'temporary')
        return true

    } catch {
        return false
    }
}

/**
 * This function disables master access on a remote mux asset.
 * @param client Sanity client (uses addon credentials).
 * @param assetId The target mux asset ID.
 * @return Return true on success.
 */
export async function disableMasterAccess(
    client: SanityClient,
    assetId: string
): Promise<boolean> {
    try {
        const secretsValid = await testSecrets(client)
        if (!secretsValid?.status) return false

        await updateMasterAccess(client, assetId, 'none')
        return true

    } catch {
        return false
    }
}

/**
 * This function checks if master access is enabled and available on a remote mux asset.
 * @param client Sanity client (uses addon credentials).
 * @param assetId The target mux asset ID.
 * @return Return the master access link if available.
 */
export async function pollMasterAccess(
    client: SanityClient,
    assetId: string
): Promise<string> {
    try {
        const res = await getAsset(client, assetId)

        const status = res.data?.master?.status ?? 'errored'
        const url = res.data?.master?.url ?? ''
        if (status === 'ready') return url
        return ''

    } catch {
        return ''
    }
}

/**
 * This function waits for master access to be enabled and available on a remote mux asset.
 * @param client Sanity client (uses addon credentials).
 * @param assetId The target mux asset ID.
 * @param timeout The timeout in seconds before dropping.
 * @param interval The interval in seconds between tries.
 * @return Return the master access link if available.
 */
export async function waitForMasterAccess(
    client: SanityClient,
    assetId: string,
    timeout = 30,
    interval = 2
): Promise<string> {

    const limit = Date.now() + timeout * 1000
    while (Date.now() < limit) {

        const url = await pollMasterAccess(client, assetId)
        if (url) return url

        await new Promise((resolve) => setTimeout(resolve, interval * 1000))
    }

    return ''
}