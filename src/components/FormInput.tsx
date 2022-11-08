import React, {lazy, memo, Suspense} from 'react'
import {type InputProps} from 'sanity'

import {isMuxInputProps} from '../util/asserters'
import {type Config} from '../util/types'
import ErrorBoundaryCard from './ErrorBoundaryCard'
import {AspectRatioCard, InputFallback} from './Input.styled'

const Input = lazy(() => import('./Input'))

// eslint-disable-next-line import/no-anonymous-default-export
export default (config: Config) =>
  memo(function FormInput(props: InputProps) {
    if (isMuxInputProps(props)) {
      return (
        <AspectRatioCard>
          <ErrorBoundaryCard schemaType={props.schemaType}>
            <Suspense fallback={<InputFallback />}>
              <Input config={config} {...props} />
            </Suspense>
          </ErrorBoundaryCard>
        </AspectRatioCard>
      )
    }
    return props.renderDefault(props)
  })
