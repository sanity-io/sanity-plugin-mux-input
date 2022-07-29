import React, {memo} from 'react'
import {useClient} from 'sanity'
import {useDocumentPreviewStore} from 'sanity/_unstable'

import {useAssetDocumentValues} from '../hooks/useAssetDocumentValues'
import {useMuxPolling} from '../hooks/useMuxPolling'
import {useSecretsDocumentValues} from '../hooks/useSecretsDocumentValues'
import type {Config, MuxInputProps} from '../util/types'
import InputLegacy from './__legacy__Input'
import {InputFallback} from './Input.styled'

export interface InputProps extends MuxInputProps {
  config: Config
}
const Input = (props: InputProps) => {
  const client = useClient()
  const previewStore = useDocumentPreviewStore()
  const secretDocumentValues = useSecretsDocumentValues()
  const assetDocumentValues = useAssetDocumentValues(props.value?.asset)
  const poll = useMuxPolling(props.readOnly ? undefined : assetDocumentValues?.value || undefined)

  const error = secretDocumentValues.error || assetDocumentValues.error || poll.error /*||
    // @TODO move errored logic to Uploader, where handleRemoveVideo can be called
    (assetDocumentValues.value?.status === 'errored'
      ? new Error(assetDocumentValues.value.data?.errors?.messages?.join(' '))
      : undefined)
      // */
  if (error) {
    // @TODO deal with it more gracefully
    throw error
  }
  const isLoading = secretDocumentValues.isLoading || assetDocumentValues.isLoading

  return (
    <>
      {isLoading ? (
        <InputFallback />
      ) : (
        <InputLegacy
          {...props}
          asset={assetDocumentValues.value}
          client={client}
          observePaths={previewStore.observePaths}
          secrets={secretDocumentValues.value.secrets}
          isInitialSetup={secretDocumentValues.value.isInitialSetup}
          needsSetup={secretDocumentValues.value.needsSetup}
        />
      )}
    </>
  )
}

export default memo(Input)
