import type {SanityClient} from '@sanity/client'
import {defer} from 'rxjs'

export function testSecretsObservable(client: SanityClient) {
  const dataset = client.clientConfig.dataset
  return defer(() =>
    client.observable.request({
      url: `/addons/mux/secrets/${dataset}/test`,
      withCredentials: true,
      method: 'GET',
    })
  )
}
