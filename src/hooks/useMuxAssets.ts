import {useEffect, useState} from 'react'
import {defer, of, timer} from 'rxjs'
import {concatMap, expand, tap} from 'rxjs/operators'
import {type SanityClient, useClient} from 'sanity'

import type {MuxAsset} from '../util/types'
import {SANITY_API_VERSION} from './useClient'

const FIRST_PAGE = 1
const ASSETS_PER_PAGE = 100

type MuxAssetsState = {
  pageNum: number
  loading: boolean
  data?: MuxAsset[]
  error?: FetchError
}

type FetchError =
  | {
      _tag: 'FetchError'
    }
  | {_tag: 'MuxError'; error: unknown}

type PageResult = (
  | {
      data: MuxAsset[]
    }
  | {
      error: FetchError
    }
) & {
  pageNum: number
}

/**
 * @docs {@link https://docs.mux.com/api-reference#video/operation/list-assets}
 * Fetches Mux assets through Sanity's query API to avoid CORS issues
 */
async function fetchMuxAssetsPage(client: SanityClient, pageNum: number): Promise<PageResult> {
  try {
    const offset = (pageNum - 1) * ASSETS_PER_PAGE
    const query = `*[_type == "mux.videoAsset"] | order(_createdAt desc) [${offset}...${offset + ASSETS_PER_PAGE}] {...}`

    const sanityDocuments = await client.fetch<any[]>(query)

    // Extract the actual Mux asset data from Sanity documents
    const muxAssets: MuxAsset[] =
      sanityDocuments
        ?.filter((doc) => doc.data) // Only include documents with data
        .map((doc) => doc.data) || [] // Extract the nested Mux asset data

    return {
      pageNum,
      data: muxAssets,
    }
  } catch (error) {
    console.error('Error fetching Mux assets:', error)
    return {
      pageNum,
      error: {_tag: 'FetchError'},
    }
  }
}

function accumulateIntermediateState(
  currentState: MuxAssetsState,
  pageResult: PageResult
): MuxAssetsState {
  const currentData = ('data' in currentState && currentState.data) || []
  return {
    ...currentState,
    data: [
      ...currentData,
      ...(('data' in pageResult && pageResult.data) || []).filter(
        // De-duplicate assets for safety
        (asset) => !currentData.some((a) => a.id === asset.id)
      ),
    ],
    error:
      'error' in pageResult
        ? pageResult.error
        : // Reset error if current page is successful
          undefined,
    pageNum: pageResult.pageNum,
    loading: true,
  }
}

function hasMorePages(pageResult: PageResult) {
  return (
    typeof pageResult === 'object' &&
    'data' in pageResult &&
    Array.isArray(pageResult.data) &&
    pageResult.data.length === ASSETS_PER_PAGE // Continue only if we got a full page
  )
}

/**
 * Fetches all assets from a Mux environment through Sanity's proxy. Rules:
 * - One page at a time
 * - We've finished fetching if a page returns `data.length === 0`
 * - Rate limiting to one request per 2 seconds
 * - Update state while still fetching to give feedback to users
 */
export default function useMuxAssets({enabled}: {enabled: boolean}) {
  const [state, setState] = useState<MuxAssetsState>({loading: true, pageNum: FIRST_PAGE})
  const client = useClient({
    apiVersion: SANITY_API_VERSION,
  })

  useEffect(() => {
    if (!enabled) {
      // Reset state when dialog closes
      setState({loading: true, pageNum: FIRST_PAGE})
      return
    }

    const subscription = defer(() =>
      fetchMuxAssetsPage(
        client,
        FIRST_PAGE // Always start from page 1 when enabled
      )
    )
      .pipe(
        // Here we replace "concatMap" with "expand" to recursively fetch next pages
        expand((pageResult) => {
          // if fetched page has data, we continue emitting, requesting the next page
          // after 2s to avoid rate limiting
          if (hasMorePages(pageResult)) {
            return timer(2000).pipe(
              // eslint-disable-next-line max-nested-callbacks
              concatMap(() => defer(() => fetchMuxAssetsPage(client, pageResult.pageNum + 1)))
            )
          }

          // Else, we stop emitting
          return of()
        }),

        // On each iteration, persist intermediate states to give feedback to users
        tap((pageResult) =>
          setState((prevState) => accumulateIntermediateState(prevState, pageResult))
        )
      )
      .subscribe({
        // Once done, let the user know we've stopped loading
        complete: () => {
          setState((prev) => ({
            ...prev,
            loading: false,
          }))
        },
      })

    // Unsubscribe on component unmount to prevent memory leaks or fetching unnecessarily
    // eslint-disable-next-line consistent-return
    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  return state
}
