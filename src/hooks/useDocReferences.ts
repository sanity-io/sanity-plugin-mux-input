import {createHookFromObservableFactory, DocumentStore, SanityDocument} from 'sanity'

import {SANITY_API_VERSION} from './useClient'

const useDocReferences = createHookFromObservableFactory<
  SanityDocument[],
  {
    documentStore: DocumentStore
    id: string
  }
>(({documentStore, id}) => {
  return documentStore.listenQuery(
    /* groq */ '*[references($id)]{_id, _type, _rev, _updatedAt, _createdAt}',
    {id},
    {
      apiVersion: SANITY_API_VERSION,
    }
  )
})

export default useDocReferences
