/* eslint-disable camelcase */
import {isString} from 'lodash'
import client from '../clients/uploadClient'
import uuid from 'uuid'
import studioClient from 'part:@sanity/base/client'

export default function uploadSource(source, privacies) {
  const fileIsUrl = isString(source)
  // Find content type
  const contentType = fileIsUrl ? 'application/json' : source.type

  let url = ''
  if (fileIsUrl) {
    url = source
  }

  const muxBody = {
    input: url,
    playback_policy: privacies || ['public']
  }

  const query = {muxBody: JSON.stringify(muxBody)}
  let body = ''
  if (!fileIsUrl) {
    body = source
  }
  return client.request({
    url: `/addons/mux/assets/${studioClient.clientConfig.dataset}`,
    withCredentials: true,
    method: 'POST',
    headers: {
      'MUX-Proxy-UUID': uuid.v4(),
      'Content-Type': contentType
    },
    query,
    body
  })
}
