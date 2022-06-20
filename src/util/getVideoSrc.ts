import type {Secrets} from '../types'
import {generateJwt} from './generateJwt'

export async function getVideoSrc(
  playbackId,
  options: Partial<Pick<Secrets, 'signingKeyId' | 'signingKeyPrivate'> & {isSigned?: boolean}> = {}
) {
  let qs = ''
  if (options.isSigned && options.signingKeyId && options.signingKeyPrivate) {
    const token = await generateJwt(
      playbackId,
      options.signingKeyId,
      options.signingKeyPrivate,
      'v'
    )
    qs = `?token=${token}`
  }

  return `https://stream.mux.com/${playbackId}.m3u8${qs}`
}
