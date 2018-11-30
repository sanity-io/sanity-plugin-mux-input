export default function getPosterSrc(playbackId, options = {}) {
  const width = options.width || 640
  const height = options.height || ''
  const time = options.time || 1
  const fitMode = typeof options.fitMode === 'undefined' ? 'smartcrop' : options.fitMode
  let url = `https://image.mux.com/${playbackId}/thumbnail.png?width=${width}&fit_mode=${fitMode}&time=${time}`
  if (options.height) {
    url += `&height=${height}`
  }
  return url
}
