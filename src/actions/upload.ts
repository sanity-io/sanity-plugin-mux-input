import type {SanityClient} from '@sanity/client'
import {uuid as generateUuid} from '@sanity/uuid'
import {concat, defer, from, of, throwError} from 'rxjs'
import {catchError, mergeMap, mergeMapTo, switchMap} from 'rxjs/operators'

import {createUpChunkObservable} from '../clients/upChunkObservable'
import {getAsset} from './assets'
import {testSecretsObservable} from './secrets'

export function cancelUpload(client, uuid) {
  return client.observable.request({
    url: `/addons/mux/uploads/${client.clientConfig.dataset}/${uuid}`,
    withCredentials: true,
    method: 'DELETE',
  })
}

type Options = any

export function uploadUrl(client: SanityClient, url, options: Options = {}) {
  return testUrl(url).pipe(
    switchMap((validUrl) => {
      return concat(
        of({type: 'url', url: validUrl}),
        testSecretsObservable(client).pipe(
          switchMap((json: any) => {
            if (!json || !json.status) {
              return throwError(new Error('Invalid credentials'))
            }
            const uuid = generateUuid()
            const {enableSignedUrls} = options
            const muxBody = {
              input: validUrl,
              playback_policy: [enableSignedUrls ? 'signed' : 'public'],
              mp4_support: options.mp4_support,
            }
            const query = {
              muxBody: JSON.stringify(muxBody),
              filename: validUrl.split('/').slice(-1)[0],
            }

            const dataset = client.clientConfig.dataset
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
              mergeMap((result: any) => {
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

export function uploadFile(client: SanityClient, file, options: Options = {}) {
  return testFile(file).pipe(
    switchMap((fileOptions) => {
      return concat(
        of({type: 'file', file: fileOptions}),
        testSecretsObservable(client).pipe(
          switchMap((json: any) => {
            if (!json || !json.status) {
              return throwError(new Error('Invalid credentials'))
            }
            const uuid = generateUuid()
            const {enableSignedUrls} = options
            const body = {
              mp4_support: options.mp4_support,
              playback_policy: [enableSignedUrls ? 'signed' : 'public'],
            }

            return concat(
              of({type: 'uuid', uuid}),
              defer(() =>
                client.observable.request({
                  url: `/addons/mux/uploads/${client.clientConfig.dataset}`,
                  withCredentials: true,
                  method: 'POST',
                  headers: {
                    'MUX-Proxy-UUID': uuid,
                    'Content-Type': 'application/json',
                  },
                  body,
                })
              ).pipe(
                mergeMap((result: any) => {
                  return createUpChunkObservable(uuid, result.upload.url, file).pipe(
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

export function getUpload(client: SanityClient, assetId) {
  return client.request({
    url: `/addons/mux/uploads/${client.clientConfig.dataset}/${assetId}`,
    withCredentials: true,
    method: 'GET',
  })
}

function pollUpload(client: SanityClient, uuid) {
  const maxTries = 10
  let pollInterval
  let tries = 0
  let assetId
  let upload
  return new Promise((resolve, reject) => {
    pollInterval = setInterval(async () => {
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

async function updateAssetDocumentFromUpload(client: SanityClient, uuid) {
  let upload
  let asset
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

function testFile(file) {
  if (typeof window !== 'undefined' && file instanceof window.File) {
    const fileOptions = optionsFromFile({}, file)
    return of(fileOptions)
  }
  return throwError(new Error('Invalid file'))
}

function testUrl(url) {
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

function optionsFromFile(opts, file) {
  if (typeof window === 'undefined' || !(file instanceof window.File)) {
    return opts
  }
  const fileOpts = {
    filename: opts.preserveFilename === false ? undefined : file.name,
    contentType: file.type,
  }

  return {
    ...{
      filename: opts.preserveFilename === false ? undefined : file.name,
      contentType: file.type,
    },
    fileOpts,
  }
}
