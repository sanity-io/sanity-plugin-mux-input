/* eslint-disable camelcase */
import client from 'part:@sanity/base/client'

export function deleteAsset(assetId) {
  const dataset = client.clientConfig.dataset
  return client.request({
    url: `/addons/mux/assets/${dataset}/${assetId}`,
    withCredentials: true,
    method: 'DELETE'
  })
}

export function getAsset(assetId) {
  const dataset = client.clientConfig.dataset
  return client.request({
    url: `/addons/mux/assets/${dataset}/data/${assetId}`,
    withCredentials: true,
    method: 'GET'
  })
}

export default {getAsset, deleteAsset}
