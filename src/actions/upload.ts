import {uuid as generateUuid} from '@sanity/uuid'
import {concat, defer, from, type Observable, of, throwError} from 'rxjs'
import {catchError, mergeMap, mergeMapTo, switchMap} from 'rxjs/operators'
import type {SanityClient} from 'sanity'

import {createUpChunkObservable} from '../clients/upChunkObservable'
import type {MuxAsset, MuxNewAssetSettings, WatermarkConfig} from '../util/types'
import {getAsset} from './assets'
import {testSecretsObservable} from './secrets'

function roundPxString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  if (!trimmed.endsWith('px')) return undefined
  const n = Number(trimmed.slice(0, -2))
  if (!Number.isFinite(n)) return undefined
  let rounded = Math.round(n)
  // Avoid sending 0px (and JS -0); keep sign when negative.
  if (rounded === 0) rounded = n < 0 ? -1 : 1
  return `${rounded}px`
}

function sanitizeOverlaySettingsInPlace(settings: MuxNewAssetSettings) {
  const inputs = settings.input
  if (!inputs) return
  for (const input of inputs) {
    const overlay = (input as {overlay_settings?: Record<string, unknown>}).overlay_settings
    if (!overlay) continue

    const hm = roundPxString(overlay.horizontal_margin)
    const vm = roundPxString(overlay.vertical_margin)
    const w = roundPxString(overlay.width)

    if (hm) overlay.horizontal_margin = hm
    if (vm) overlay.vertical_margin = vm
    if (w) overlay.width = w
  }
}

function sanitizePxStringsInJson(json: string): string {
  return json.replace(/"(-?\d+(?:\.\d+)?)px"/g, (_match, num) => {
    const n = Number(num)
    if (!Number.isFinite(n)) return _match
    let rounded = Math.round(n)
    if (rounded === 0) rounded = n < 0 ? -1 : 1
    return `"${rounded}px"`
  })
}

export function cancelUpload(client: SanityClient, uuid: string) {
  return client.observable.request({
    url: `/addons/mux/uploads/${client.config().dataset}/${uuid}`,
    withCredentials: true,
    method: 'DELETE',
  })
}

export function uploadUrl({
  url,
  settings,
  client,
  watermark,
}: {
  url: string
  settings: MuxNewAssetSettings
  client: SanityClient
  watermark?: WatermarkConfig
}) {
  return testUrl(url).pipe(
    switchMap((validUrl) => {
      return concat(
        of({type: 'url' as const, url: validUrl}),
        testSecretsObservable(client).pipe(
          switchMap((json) => {
            if (!json || !json.status) {
              return throwError(new Error('Invalid credentials'))
            }
            const uuid = generateUuid()
            const muxBody = settings
            if (!muxBody.input) muxBody.input = [{type: 'video'}]
            muxBody.input[0].url = validUrl
            sanitizeOverlaySettingsInPlace(muxBody)

            const query = {
              muxBody: sanitizePxStringsInJson(JSON.stringify(muxBody)),
              filename: validUrl.split('/').slice(-1)[0],
            }

            const dataset = client.config().dataset
            return defer(() =>
              client.observable.request({
                url: `/addons/mux/assets/${dataset}`,
                withCredentials: true,
                method: 'POST',
                headers: {
                  'MUX-Proxy-UUID': uuid,
                  'Content-Type': 'application/json',
                },
                query,
              })
            ).pipe(
              mergeMap((result) => {
                const asset =
                  (result && result.results && result.results[0] && result.results[0].document) ||
                  null

                if (!asset) {
                  return throwError(new Error('No asset document returned'))
                }
                return of({type: 'success' as const, id: uuid, asset})
              })
            )
          })
        )
      )
    })
  )
}

export function uploadFile({
  settings,
  client,
  file,
  watermark,
}: {
  settings: MuxNewAssetSettings
  client: SanityClient
  file: File
  watermark?: WatermarkConfig
}) {
  return testFile(file).pipe(
    switchMap((fileOptions) => {
      return concat(
        of({type: 'file' as const, file: fileOptions}),
        testSecretsObservable(client).pipe(
          switchMap((json) => {
            if (!json || !json.status) {
              return throwError(() => new Error('Invalid credentials'))
            }
            const uuid = generateUuid()
            const body = settings
            sanitizeOverlaySettingsInPlace(body)

            return concat(
              of({type: 'uuid' as const, uuid}),
              defer(() =>
                client.observable.request<{
                  sanityAssetId: string
                  upload: {
                    cors_origin: string
                    id: string
                    new_asset_settings: MuxNewAssetSettings
                    status: 'waiting'
                    timeout: number
                    url: string
                  }
                }>({
                  url: `/addons/mux/uploads/${client.config().dataset}`,
                  withCredentials: true,
                  method: 'POST',
                  headers: {
                    'MUX-Proxy-UUID': uuid,
                    'Content-Type': 'application/json',
                  },
                  body,
                })
              ).pipe(
                mergeMap((result) => {
                  return createUpChunkObservable(uuid, result.upload.url, file).pipe(
                    // eslint-disable-next-line no-warning-comments
                    // @TODO type the observable events
                    // eslint-disable-next-line max-nested-callbacks
                    mergeMap((event) => {
                      if (event.type !== 'success') {
                        return of(event)
                      }
                      return from(updateAssetDocumentFromUpload(client, uuid, watermark)).pipe(
                        // eslint-disable-next-line max-nested-callbacks
                        mergeMap((doc) => of({...event, asset: doc}))
                      )
                    }),
                    // eslint-disable-next-line max-nested-callbacks
                    catchError((err) => {
                      // Delete asset document
                      return cancelUpload(client, uuid).pipe(mergeMapTo(throwError(err)))
                    })
                  )
                })
              )
            )
          })
        )
      )
    })
  )
}

type UploadResponse = {
  data: {
    asset_id: string
    cors_origin: string
    id: string
    new_asset_settings: {
      static_renditions?: {resolution: string}[]
      passthrough: string
      playback_policies: ['public' | 'signed' | 'drm']
    }
    status: string
    timeout: number
  }
}
export function getUpload(client: SanityClient, assetId: string) {
  const {dataset} = client.config()
  return client.request<UploadResponse>({
    url: `/addons/mux/uploads/${dataset}/${assetId}`,
    withCredentials: true,
    method: 'GET',
  })
}

function pollUpload(client: SanityClient, uuid: string): Promise<UploadResponse> {
  const maxTries = 10
  let pollInterval: number
  let tries = 0
  let assetId: string
  let upload: UploadResponse
  return new Promise((resolve, reject) => {
    pollInterval = (setInterval as typeof window.setInterval)(async () => {
      try {
        upload = await getUpload(client, uuid)
      } catch (err) {
        reject(err)
        return
      }
      assetId = upload && upload.data && upload.data.asset_id
      if (assetId) {
        clearInterval(pollInterval)
        resolve(upload)
      }
      if (tries > maxTries) {
        clearInterval(pollInterval)
        reject(new Error('Upload did not finish'))
      }
      tries++
    }, 2000)
  })
}

async function updateAssetDocumentFromUpload(
  client: SanityClient,
  uuid: string,
  _watermark?: WatermarkConfig
) {
  let upload: UploadResponse
  let asset: {data: MuxAsset}
  try {
    upload = await pollUpload(client, uuid)
  } catch (err) {
    return Promise.reject(err)
  }
  try {
    asset = await getAsset(client, upload.data.asset_id)
  } catch (err) {
    return Promise.reject(err)
  }

  const doc = {
    _id: uuid,
    _type: 'mux.videoAsset',
    status: asset.data.status,
    data: asset.data,
    assetId: asset.data.id,
    playbackId: asset.data.playback_ids[0].id,
    uploadId: upload.data.id,
  }
  return client.createOrReplace(doc).then(() => {
    return doc
  })
}

export function testFile(file: File) {
  if (typeof window !== 'undefined' && file instanceof window.File) {
    const fileOptions = optionsFromFile({}, file)
    return of(fileOptions)
  }
  return throwError(new Error('Invalid file'))
}

export function testUrl(url: string): Observable<string> {
  const error = new Error('Invalid URL')
  if (typeof url !== 'string') {
    return throwError(error)
  }
  const trimmedUrl = url.trim()
  let parsed
  try {
    parsed = new URL(trimmedUrl)
  } catch (err) {
    return throwError(error)
  }
  if (parsed && !parsed.protocol.match(/http:|https:/)) {
    return throwError(error)
  }
  return of(trimmedUrl)
}

function optionsFromFile(opts: {preserveFilename?: boolean}, file: File) {
  if (typeof window === 'undefined' || !(file instanceof window.File)) {
    return undefined
  }
  return {
    name: opts.preserveFilename === false ? undefined : file.name,
    type: file.type,
  }
}
