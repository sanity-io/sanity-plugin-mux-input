import * as UpChunk from '@mux/upchunk'
import {Observable} from 'rxjs'

export function createUpChunkObservable(uuid, uploadUrl, source) {
  return new Observable(subscriber => {
    const upchunk = UpChunk.createUpload({
      endpoint: uploadUrl,
      file: source,
      chunkSize: 5120 // Uploads the file in ~5mb chunks
    })

    const successHandler = () => {
      subscriber.next({
        type: 'success',
        id: uuid
      })
      subscriber.complete()
    }

    const errorHandler = data => subscriber.error(new Error(data.detail.message))

    const progressHandler = data => {
      return subscriber.next({type: 'progress', percent: data.detail})
    }

    const offlineHandler = data => {
      upchunk.pause()
      subscriber.next({
        type: 'pause',
        id: uuid
      })
    }

    const onlineHandler = data => {
      upchunk.resume()
      subscriber.next({
        type: 'resume',
        id: uuid
      })
    }

    upchunk.on('success', successHandler)
    upchunk.on('error', errorHandler)
    upchunk.on('progress', progressHandler)
    upchunk.on('offline', offlineHandler)
    upchunk.on('online', onlineHandler)

    return () => {
      upchunk.pause()
      // Should be teared down here, but upChunk doesn't support it
    }
  })
}
