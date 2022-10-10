// As it's required to specify the API Version this custom hook ensures it's all using the same version
import {useClient as useSanityClient} from 'sanity'

export function useClient() {
  return useSanityClient({apiVersion: '2022-09-14'})
}
