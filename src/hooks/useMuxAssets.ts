import {useEffect, useState} from 'react'
import {defer, of, timer} from 'rxjs'
import {concatMap, expand, tap} from 'rxjs/operators'

import type {MuxAsset, Secrets} from '../util/types'

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
 */
async function fetchMuxAssetsPage(
  {secretKey, token}: Secrets,
  pageNum: number
): Promise<PageResult> {
  try {
    const res = await fetch(
      `https://api.mux.com/video/v1/assets?limit=${ASSETS_PER_PAGE}&page=${pageNum}`,
      {
        headers: {
          Authorization: `Basic ${btoa(`${token}:${secretKey}`)}`,
        },
      }
    )
    const json = await res.json()

    if (json.error) {
      return {
        pageNum,
        error: {
          _tag: 'MuxError',
          error: json.error,
        },
      }
    }

    return {
      pageNum,
      data: json.data as MuxAsset[],
    }
  } catch (error) {
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
    pageResult.data.length > 0
  )
}

/**
 * Fetches all assets from a Mux environment. Rules:
 * - One page at a time
 * - Mux has no information on pagination
 *   - We've finished fetching if a page returns `data.length === 0`
 * - Rate limiting to one request per 2 seconds
 * - Update state while still fetching to give feedback to users
 */
export default function useMuxAssets({secrets, enabled}: {enabled: boolean; secrets: Secrets}) {
  const [state, setState] = useState<MuxAssetsState>({loading: true, pageNum: FIRST_PAGE})

  useEffect(() => {
    if (!enabled) return

    const subscription = defer(() =>
      fetchMuxAssetsPage(
        secrets,
        // When we've already successfully loaded before (fully or partially), we start from the following page to avoid re-fetching
        'data' in state && state.data && state.data.length > 0 && !state.error
          ? state.pageNum + 1
          : state.pageNum
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
              concatMap(() => defer(() => fetchMuxAssetsPage(secrets, pageResult.pageNum + 1)))
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
