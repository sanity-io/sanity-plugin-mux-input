/* eslint-disable camelcase */
import {uuid as generateUuid} from '@sanity/uuid'
import {concat, defer, from, type Observable, of, throwError} from 'rxjs'
import {catchError, mergeMap, mergeMapTo, switchMap} from 'rxjs/operators'
import type {SanityClient} from 'sanity'

import {createUpChunkObservable} from '../clients/upChunkObservable'
import type {Config, MuxAsset} from '../util/types'
import {getAsset} from './assets'
import {testSecretsObservable} from './secrets'

export function cancelUpload(client: SanityClient, uuid: string) {
  return client.observable.request({
    url: `/addons/mux/uploads/${client.config().dataset}/${uuid}`,
    withCredentials: true,
    method: 'DELETE',
  })
}

export function uploadUrl(
  config: Config,
  client: SanityClient,
  url: string,
  options: {enableSignedUrls?: boolean} = {}
) {
  return testUrl(url).pipe(
    switchMap((validUrl) => {
      return concat(
        of({type: 'url', url: validUrl}),
        testSecretsObservable(client).pipe(
          switchMap((json) => {
            if (!json || !json.status) {
              return throwError(new Error('Invalid credentials'))
            }
            const uuid = generateUuid()
            const {enableSignedUrls} = options
            const muxBody = {
              input: validUrl,
              playback_policy: [enableSignedUrls ? 'signed' : 'public'],
              mp4_support: config.mp4_support,
            }
            const query = {
              muxBody: JSON.stringify(muxBody),
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
                return of({type: 'success', id: uuid, asset})
              })
            )
          })
        )
      )
    })
  )
}

export function uploadFile(
  config: Config,
  client: SanityClient,
  file: File,
  options: {enableSignedUrls?: boolean} = {}
) {
  return testFile(file).pipe(
    switchMap((fileOptions) => {
      return concat(
        of({type: 'file', file: fileOptions}),
        testSecretsObservable(client).pipe(
          switchMap((json) => {
            if (!json || !json.status) {
              return throwError(new Error('Invalid credentials'))
            }
            const uuid = generateUuid()
            const {enableSignedUrls} = options
            const body = {
              mp4_support: config.mp4_support,
              playback_policy: [enableSignedUrls ? 'signed' : 'public'],
            }

            return concat(
              of({type: 'uuid', uuid}),
              defer(() =>
                client.observable.request<{
                  sanityAssetId: string
                  upload: {
                    cors_origin: string
                    id: string
                    new_asset_settings: {
                      mp4_support: 'standard' | 'none'
                      passthrough: string
                      playback_policies: ['public' | 'signed']
                    }
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
                    mergeMap((event: any) => {
                      if (event.type !== 'success') {
                        return of(event)
                      }
                      return from(updateAssetDocumentFromUpload(client, uuid)).pipe(
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
      mp4_support: 'standard' | 'none'
      passthrough: string
      playback_policies: ['public' | 'signed']
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

async function updateAssetDocumentFromUpload(client: SanityClient, uuid: string) {
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

function testFile(file: File) {
  if (typeof window !== 'undefined' && file instanceof window.File) {
    const fileOptions = optionsFromFile({}, file)
    return of(fileOptions)
  }
  return throwError(new Error('Invalid file'))
}

function testUrl(url: string): Observable<string> {
  const error = new Error('Invalid URL')
  if (typeof url !== 'string') {
    return throwError(error)
  }
  let parsed
  try {
    parsed = new URL(url)
  } catch (err) {
    return throwError(error)
  }
  if (parsed && !parsed.protocol.match(/http:|https:/)) {
    return throwError(error)
  }
  return of(url)
}

function optionsFromFile(opts: {preserveFilename?: boolean}, file: File) {
  if (typeof window === 'undefined' || !(file instanceof window.File)) {
    return opts
  }
  return {
    name: opts.preserveFilename === false ? undefined : file.name,
    type: file.type,
  }
}
