import type {SanityClient} from '@sanity/client'
import _sanityClient from 'part:@sanity/base/client'
const sanityClient = _sanityClient as SanityClient

const isContentLakeSupported = typeof sanityClient.withConfig === 'function'

export const client = isContentLakeSupported
  ? sanityClient.withConfig({apiVersion: '2021-05-17'})
  : sanityClient

export default client
