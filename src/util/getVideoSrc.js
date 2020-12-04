import generateJwt from './generateJwt'

export default function getVideoSrc(playbackId, options = {}) {
  let qs = ''
  if (options.isSigned && options.signingKeyId && options.signingKeyPrivate) {
    const token = generateJwt(playbackId, options.signingKeyId, options.signingKeyPrivate, 'v')
    qs = `?token=${token}`
  }

  return `https://stream.mux.com/${playbackId}.m3u8${qs}`
}
