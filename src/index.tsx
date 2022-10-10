import React, {lazy, Suspense} from 'react'
import {createPlugin} from 'sanity'

import ErrorBoundaryCard from './components/ErrorBoundaryCard'
import {AspectRatioCard, InputFallback} from './components/Input.styled'
import {isMuxInputPreviewProps, isMuxInputProps} from './util/asserters'
import {type Config} from './util/types'

const Input = lazy(() => import('./components/Input'))
const Preview = lazy(() => import('./components/Preview'))

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
              {/* @ts-expect-error */}
              <Preview {...props} />
            </AspectRatioCard>
          )
        }
        return next(props)
      },
    },
    schema: {
      types: [
        {
          name: 'mux.video',
          type: 'object',
          title: 'Video asset reference',
          fields: [
            {
              title: 'Video',
              name: 'asset',
              type: 'reference',
              weak: true,
              to: [{type: 'mux.videoAsset'}],
            },
          ],
        },
        {
          name: 'mux.videoAsset',
          type: 'object',
          title: 'Video asset',
          fields: [
            {
              type: 'string',
              name: 'status',
            },
            {
              type: 'string',
              name: 'assetId',
            },
            {
              type: 'string',
              name: 'playbackId',
            },
            {
              type: 'string',
              name: 'filename',
            },
            {
              type: 'number',
              name: 'thumbTime',
            },
          ],
        },
      ],
    },
  }
})

export {Input, Preview}
