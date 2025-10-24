import {useEffect, useState} from 'react'
import {defer, of, timer} from 'rxjs'
import {concatMap, expand, tap} from 'rxjs/operators'
import type {SanityClient} from 'sanity'

import {listAssets} from '../actions/assets'
import type {MuxAsset} from '../util/types'

const ASSETS_PER_PAGE = 100

type MuxAssetsState = {
  cursor: string | null
  loading: boolean
  data?: MuxAsset[]
  error?: FetchError
  hasSkippedAssetsWithoutPlayback?: boolean
}

type FetchError =
  | {
      _tag: 'FetchError'
    }
  | {_tag: 'MuxError'; error: unknown}

type PageResult = (
  | {
      data: MuxAsset[]
      next_cursor: string | null
    }
  | {
      error: FetchError
    }
) & {
  cursor: string | null
}

/**
 * @docs {@link https://docs.mux.com/api-reference#video/operation/list-assets}
 */
async function fetchMuxAssetsPage(
  client: SanityClient,
  cursor: string | null
): Promise<PageResult> {
  try {
    const response = await listAssets(client, {
      limit: ASSETS_PER_PAGE,
      cursor,
    })

    return {
      cursor,
      data: response.data as MuxAsset[],
      next_cursor: response.next_cursor || null,
    }
  } catch (error) {
    return {
      cursor,
      error: {_tag: 'FetchError'},
    }
  }
}

function accumulateIntermediateState(
  currentState: MuxAssetsState,
  pageResult: PageResult
): MuxAssetsState {
  const currentData = ('data' in currentState && currentState.data) || []
  const newAssets = ('data' in pageResult && pageResult.data) || []

  // Filter assets and check for skipped items
  const {validAssets, skippedInThisPage} = newAssets.reduce<{
    validAssets: MuxAsset[]
    skippedInThisPage: boolean
  }>(
    (acc, asset) => {
      const hasPlaybackIds = asset.playback_ids && asset.playback_ids.length > 0
      const isDuplicate = currentData.some((a) => a.id === asset.id)

      if (!hasPlaybackIds) {
        acc.skippedInThisPage = true
      }

      if (hasPlaybackIds && !isDuplicate) {
        acc.validAssets.push(asset)
      }

      return acc
    },
    {validAssets: [], skippedInThisPage: false}
  )

  return {
    ...currentState,
    data: [...currentData, ...validAssets],
    error:
      'error' in pageResult
        ? pageResult.error
        : // Reset error if current page is successful
          undefined,
    cursor: 'next_cursor' in pageResult ? pageResult.next_cursor : pageResult.cursor,
    loading: true,
    hasSkippedAssetsWithoutPlayback:
      currentState.hasSkippedAssetsWithoutPlayback || skippedInThisPage,
  }
}

function hasMorePages(pageResult: PageResult) {
  return (
    typeof pageResult === 'object' && 'next_cursor' in pageResult && pageResult.next_cursor !== null
  )
}

/**
 * Fetches all assets from a Mux environment. Rules:
 * - One page at a time
 * - Uses cursor-based pagination
 *   - We've finished fetching when `next_cursor` is null
 * - Rate limiting to one request per 2 seconds
 * - Update state while still fetching to give feedback to users
 */
export default function useMuxAssets({client, enabled}: {client: SanityClient; enabled: boolean}) {
  const [state, setState] = useState<MuxAssetsState>({loading: true, cursor: null})

  useEffect(() => {
    if (!enabled) return

    const subscription = defer(() =>
      fetchMuxAssetsPage(
        client,
        // When we've already successfully loaded before (fully or partially), we start from the next cursor to avoid re-fetching
        'data' in state && state.data && state.data.length > 0 && !state.error ? state.cursor : null
      )
    )
      .pipe(
        // Here we use "expand" to recursively fetch next pages
        expand((pageResult) => {
          // if fetched page has next_cursor, we continue emitting, requesting the next page
          // after 2s to avoid rate limiting
          if (hasMorePages(pageResult)) {
            return timer(2000).pipe(
              concatMap(() =>
                // eslint-disable-next-line max-nested-callbacks
                defer(() =>
                  fetchMuxAssetsPage(
                    client,
                    'next_cursor' in pageResult ? pageResult.next_cursor : null
                  )
                )
              )
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
