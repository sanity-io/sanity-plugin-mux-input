import type {Secrets} from '../types'
import {generateJwt} from './generateJwt'

export async function getStoryboardSrc(
  playbackId,
  options: Partial<Pick<Secrets, 'signingKeyId' | 'signingKeyPrivate'> & {isSigned?: boolean}> = {}
) {
  const {isSigned = false} = options

  let qs = ''
  if (isSigned && options.signingKeyId && options.signingKeyPrivate) {
    const token = await generateJwt(
      playbackId,
      options.signingKeyId,
      options.signingKeyPrivate,
      's'
    )
    qs = `?token=${token}`
  }

  return `https://image.mux.com/${playbackId}/storyboard.vtt${qs}`
}
