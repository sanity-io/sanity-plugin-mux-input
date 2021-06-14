/* eslint-disable camelcase */
import generateJwt from './generateJwt'

export default function getPosterSrc(playbackId, options = {}) {
  const {width = 640, height = null, time = 1, fit_mode = 'preserve', isSigned = false} = options
  const params = {width, time, fit_mode}

  if (options.height) {
    params.height = height.toString()
  }

  let qs
  if (isSigned && options.signingKeyId && options.signingKeyPrivate) {
    const token = generateJwt(
      playbackId,
      options.signingKeyId,
      options.signingKeyPrivate,
      't',
      params
    )
    qs = `token=${token}`
  } else {
    qs = Object.keys(params)
      .map((key) => `${key}=${params[key]}`)
      .join('&')
  }

  return `https://image.mux.com/${playbackId}/thumbnail.png?${qs}`
}
