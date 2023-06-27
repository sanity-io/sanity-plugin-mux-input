import React, {memo, Suspense} from 'react'

import {useAssetDocumentValues} from '../hooks/useAssetDocumentValues'
import {useClient} from '../hooks/useClient'
import {useDialogState} from '../hooks/useDialogState'
import {useMuxPolling} from '../hooks/useMuxPolling'
import {useSecretsDocumentValues} from '../hooks/useSecretsDocumentValues'
import type {Config, MuxInputProps} from '../util/types'
import Uploader from './__legacy__Uploader'
import ConfigureApi from './ConfigureApi'
import ErrorBoundaryCard from './ErrorBoundaryCard'
import {AspectRatioCard, InputFallback} from './Input.styled'
import Onboard from './Onboard'

export interface InputProps extends MuxInputProps {
  config: Config
}
const Input = (props: InputProps) => {
  const client = useClient()
  const secretDocumentValues = useSecretsDocumentValues()
  const assetDocumentValues = useAssetDocumentValues(props.value?.asset)
  const poll = useMuxPolling(props.readOnly ? undefined : assetDocumentValues?.value || undefined)
  const [dialogState, setDialogState] = useDialogState()

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
    <AspectRatioCard>
      <ErrorBoundaryCard schemaType={props.schemaType}>
        <Suspense fallback={<InputFallback />}>
          {isLoading ? (
            <InputFallback />
          ) : (
            <>
              {secretDocumentValues.value.needsSetup && !assetDocumentValues.value ? (
                <Onboard setDialogState={setDialogState} />
              ) : (
                <Uploader
                  {...props}
                  config={props.config}
                  onChange={props.onChange}
                  client={client}
                  secrets={secretDocumentValues.value.secrets}
                  asset={assetDocumentValues.value}
                  dialogState={dialogState}
                  setDialogState={setDialogState}
                  needsSetup={secretDocumentValues.value.needsSetup}
                />
              )}

              {dialogState === 'secrets' && (
                <ConfigureApi
                  setDialogState={setDialogState}
                  secrets={secretDocumentValues.value.secrets}
                />
              )}
            </>
          )}
        </Suspense>
      </ErrorBoundaryCard>
    </AspectRatioCard>
  )
}

export default memo(Input)
