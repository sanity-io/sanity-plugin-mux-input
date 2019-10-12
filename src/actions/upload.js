/* eslint-disable camelcase */
import client from 'part:@sanity/base/client'
import Uuid from 'uuid'
import {isString} from 'lodash'
import {throwError, of, from, concat, defer} from 'rxjs'
import {mergeMap, catchError, mergeMapTo, switchMap} from 'rxjs/operators'
import studioClient from 'part:@sanity/base/client'
import {createUpChunkObservable} from '../clients/upChunkObserable'
import {getAsset} from '../actions/assets'
import {testSecretsObservable} from '../actions/secrets'

export function cancelUpload(uuid) {
  return client.observable.request({
    url: `/addons/mux/uploads/${client.clientConfig.dataset}/${uuid}`,
    withCredentials: true,
    method: 'DELETE'
  })
}

export function uploadUrl(url, options = {}) {
  return testUrl(url).pipe(
    switchMap(validUrl => {
      return concat(
        of({type: 'url', url: validUrl}),
        testSecretsObservable().pipe(
          switchMap(json => {
            if (!json || !json.status) {
              return throwError(new Error('Invalid credentials'))
            }
            const uuid = Uuid.v4()
            const {privacies} = options
            const muxBody = {
              input: validUrl,
              playback_policy: privacies || ['public']
            }
            const query = {
              muxBody: JSON.stringify(muxBody),
              filename: validUrl.split('/').slice(-1)[0]
            }
            const dataset = studioClient.clientConfig.dataset
            return defer(() =>
              client.observable.request({
                url: `/addons/mux/assets/${dataset}`,
                withCredentials: true,
                method: 'POST',
                headers: {
                  'MUX-Proxy-UUID': uuid,
                  'Content-Type': 'application/json'
                },
                query
              })
            ).pipe(
              mergeMap(result => {
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

export function uploadFile(file) {
  return testFile(file).pipe(
    switchMap(fileOptions => {
      return concat(
        of({type: 'file', file: fileOptions}),
        testSecretsObservable().pipe(
          switchMap(json => {
            if (!json || !json.status) {
              return throwError(new Error('Invalid credentials'))
            }
            const uuid = Uuid.v4()
            return concat(
              of({type: 'uuid', uuid}),
              defer(() =>
                client.observable.request({
                  url: `/addons/mux/uploads/${studioClient.clientConfig.dataset}`,
                  withCredentials: true,
                  method: 'POST',
                  headers: {
                    'MUX-Proxy-UUID': uuid,
                    'Content-Type': 'application/json'
                  }
                })
              ).pipe(
                mergeMap(result => {
                  return createUpChunkObservable(uuid, result.upload.url, file).pipe(
                    // eslint-disable-next-line max-nested-callbacks
                    mergeMap(event => {
                      if (event.type !== 'success') {
                        return of(event)
                      }
                      return from(updateAssetDocumentFromUpload(uuid)).pipe(
                        // eslint-disable-next-line max-nested-callbacks
                        mergeMap(doc => of({...event, asset: doc}))
                      )
                    }),
                    // eslint-disable-next-line max-nested-callbacks
                    catchError(err => {
                      // Delete asset document
                      return cancelUpload(uuid).pipe(mergeMapTo(throwError(err)))
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

export function getUpload(assetId) {
  return client.request({
    url: `/addons/mux/uploads/${studioClient.clientConfig.dataset}/${assetId}`,
    withCredentials: true,
    method: 'GET'
  })
}

export default {uploadUrl, uploadFile, getUpload}

function pollUpload(uuid) {
  const maxTries = 10
  let pollInterval
  let tries = 0
  let assetId
  let upload
  return new Promise((resolve, reject) => {
    pollInterval = setInterval(async () => {
      try {
        upload = await getUpload(uuid)
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

async function updateAssetDocumentFromUpload(uuid) {
  let upload
  let asset
  try {
    upload = await pollUpload(uuid)
  } catch (err) {
    return Promise.reject(err)
  }
  try {
    asset = await getAsset(upload.data.asset_id)
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
    uploadId: upload.data.id
  }
  return client.createOrReplace(doc).then(() => {
    return doc
  })
}

function testFile(file) {
  if (typeof window !== 'undefined' && file instanceof window.File) {
    const fileOptions = optionsFromFile(file)
    return of(fileOptions)
  }
  return throwError(new Error('Invalid file'))
}

function testUrl(url) {
  const error = new Error('Invalid URL')
  if (!isString(url)) {
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
    contentType: file.type
  }

  return {
    ...{
      filename: opts.preserveFilename === false ? undefined : file.name,
      contentType: file.type
    },
    fileOpts
  }
}
