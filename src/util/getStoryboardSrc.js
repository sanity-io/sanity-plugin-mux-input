/* eslint-disable camelcase */
import generateJwt from './generateJwt'

export default function getStoryboardSrc(playbackId, options = {}) {
  const {isSigned = false} = options

  let qs = ''
  if (isSigned && options.signingKeyId && options.signingKeyPrivate) {
    const token = generateJwt(playbackId, options.signingKeyId, options.signingKeyPrivate, 's')
    qs = `?token=${token}`
  }

  return `https://image.mux.com/${playbackId}/storyboard.vtt?${qs}`
}
