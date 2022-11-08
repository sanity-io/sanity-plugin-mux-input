import {definePlugin} from 'sanity'

import createFormInput from './components/FormInput'
import FormPreview from './components/FormPreview'
import {type Config} from './util/types'

export const defaultConfig: Config = {
  mp4_support: 'none',
}

export const muxInput = definePlugin<Partial<Config> | void>((userConfig) => {
  const config: Config = {...defaultConfig, ...userConfig}
  const InputComponent = createFormInput(config)
  return {
    name: 'mux-input',
    form: {
      components: {
        input: InputComponent,
        preview: FormPreview,
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
