import {useMemo} from 'react'
import {useDocumentValues} from 'sanity'

import {muxSecretsDocumentId} from '../util/constants'
import type {Secrets} from '../util/types'

const path = ['token', 'secretKey', 'enableSignedUrls', 'signingKeyId', 'signingKeyPrivate']
export const useSecretsDocumentValues = () => {
  const {error, isLoading, value} = useDocumentValues<Partial<Secrets> | null | undefined>(
    muxSecretsDocumentId,
    path
  )
  const cache = useMemo(() => {
    const exists = Boolean(value)
    const secrets: Secrets = {
      token: value?.token || null,
      secretKey: value?.secretKey || null,
      enableSignedUrls: value?.enableSignedUrls || false,
      signingKeyId: value?.signingKeyId || null,
      signingKeyPrivate: value?.signingKeyPrivate || null,
    }
    return {
      isInitialSetup: !exists,
      needsSetup: !secrets?.token || !secrets?.secretKey,
      secrets,
    }
  }, [value])

  return {error, isLoading, value: cache}
}
