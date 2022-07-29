import React, {memo, Suspense} from 'react'
import {useClient} from 'sanity'
import {useDocumentPreviewStore} from 'sanity/_unstable'

import {useSecretsDocumentValues} from '../hooks/useSecretsDocumentValues'
import type {Config, MuxInputProps} from '../util/types'
import InputLegacy from './__legacy__Input'
import ErrorBoundaryCard from './ErrorBoundaryCard'
import {AspectRatioCard, InputFallback} from './Input.styled'

export interface InputProps extends MuxInputProps {
  config: Config
}
const Input = (props: InputProps) => {
  const client = useClient()
  const previewStore = useDocumentPreviewStore()
  const secretDocumentValues = useSecretsDocumentValues()

  const error = secretDocumentValues.error
  if (error) {
    // @TODO deal with it more gracefully
    throw error
  }
  const isLoading = secretDocumentValues.isLoading

  console.log(
    'secretsValues',
    secretDocumentValues.isLoading,
    secretDocumentValues.error,
    secretDocumentValues.value
  )

  return (
    <ErrorBoundaryCard schemaType={props.schemaType}>
      <AspectRatioCard>
        {isLoading ? (
          <InputFallback />
        ) : (
          <Suspense fallback={<InputFallback />}>
            token: {secretDocumentValues.value.secrets.token}
            <InputLegacy
              {...props}
              client={client}
              observePaths={previewStore.observePaths}
              secrets={secretDocumentValues.value.secrets}
              isInitialSetup={secretDocumentValues.value.isInitialSetup}
              needsSetup={secretDocumentValues.value.needsSetup}
            />
          </Suspense>
        )}
      </AspectRatioCard>
    </ErrorBoundaryCard>
  )
}

export default memo(Input)
