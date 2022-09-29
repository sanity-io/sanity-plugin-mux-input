import * as UpChunk from '@mux/upchunk'
import {Observable} from 'rxjs'

export function createUpChunkObservable(uuid: string, uploadUrl: string, source: File) {
  return new Observable((subscriber) => {
    const upchunk = UpChunk.createUpload({
      endpoint: uploadUrl,
      file: source,
      dynamicChunkSize: true, // changes the chunk size based on network speeds
    })

    const successHandler = () => {
      subscriber.next({
        type: 'success',
        id: uuid,
      })
      subscriber.complete()
    }

    const errorHandler = (data: CustomEvent) => subscriber.error(new Error(data.detail.message))

    const progressHandler = (data: CustomEvent) => {
      return subscriber.next({type: 'progress', percent: data.detail})
    }

    const offlineHandler = () => {
      upchunk.pause()
      subscriber.next({
        type: 'pause',
        id: uuid,
      })
    }

    const onlineHandler = () => {
      upchunk.resume()
      subscriber.next({
        type: 'resume',
        id: uuid,
      })
    }

    upchunk.on('success', successHandler)
    upchunk.on('error', errorHandler)
    upchunk.on('progress', progressHandler)
    upchunk.on('offline', offlineHandler)
    upchunk.on('online', onlineHandler)

    return () => upchunk.abort()
  })
}
