import React, {lazy, Suspense} from 'react'
import {createPlugin} from 'sanity'

import ErrorBoundaryCard from './components/ErrorBoundaryCard'
import {AspectRatioCard, InputFallback} from './components/Input.styled'
import muxVideo from './schema/mux.video'
import videoAsset from './schema/mux.videoAsset'
import {isMuxInputPreviewProps, isMuxInputProps} from './util/asserters'
import {type Config} from './util/types'

const Input = lazy(() => import('./components/Input'))
const Preview = lazy(() => import('./components/Preview'))

/*
// @TODO use declaration merging to allow correct typings for userland schemas when they use type: mux.video
declare module 'sanity' {
  namespace Schema {

  }
}
// */

/* @TODO export validation rules for: required (checks if the video asset is defined), and that it has a ready uploaded file
export const validation = {
  required(Rule: Rule) {
    return
  }
}
// */

export const defaultConfig: Config = {
  mp4_support: 'none',
}

export const muxInput = createPlugin<Partial<Config> | void>((userConfig) => {
  const config: Config = {...defaultConfig, ...userConfig}
  return {
    name: 'mux-input',
    form: {
      renderInput(props, next) {
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
        return next(props)
      },
      renderPreview(props, next) {
        if (isMuxInputPreviewProps(props)) {
          return (
            <AspectRatioCard>
              <Preview {...props} />
            </AspectRatioCard>
          )
        }
        return next(props)
      },
    },
    schema: {types: [muxVideo, videoAsset]},
  }
})

export {Input, Preview}
