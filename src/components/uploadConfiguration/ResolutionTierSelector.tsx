import {Flex, Radio, Text} from '@sanity/ui'
import {ActionDispatch} from 'react'
import {FormField} from 'sanity'

import {type UploadConfig} from '../../util/types'
import {UploadConfigurationStateAction} from '../UploadConfiguration'

export const RESOLUTION_TIERS = [
  {value: '1080p', label: '1080p'},
  {value: '1440p', label: '1440p (2k)'},
  {value: '2160p', label: '2160p (4k)'},
] as const satisfies {value: UploadConfig['max_resolution_tier']; label: string}[]

export const ResolutionTierSelector = ({
  id,
  config,
  dispatch,
  maxSupportedResolution,
}: {
  id: string
  config: UploadConfig
  dispatch: ActionDispatch<[action: UploadConfigurationStateAction]>
  maxSupportedResolution: number
}) => {
  return (
    <FormField
      title="Resolution Tier"
      description={
        <>
          The maximum{' '}
          <a
            href="https://docs.mux.com/api-reference#video/operation/create-direct-upload"
            target="_blank"
            rel="noopener noreferrer"
          >
            resolution_tier
          </a>{' '}
          your asset is encoded, stored, and streamed at.
        </>
      }
    >
      <Flex gap={3} wrap={'wrap'}>
        {RESOLUTION_TIERS.map(({value, label}, index) => {
          const inputId = `${id}--type-${value}`

          if (index > maxSupportedResolution) return null

          return (
            <Flex key={value} align="center" gap={2}>
              <Radio
                checked={config.max_resolution_tier === value}
                name="asset-resolutiontier"
                onChange={(e) =>
                  dispatch({
                    action: 'max_resolution_tier',
                    value: e.currentTarget.value as UploadConfig['max_resolution_tier'],
                  })
                }
                value={value}
                id={inputId}
              />
              <Text as="label" htmlFor={inputId}>
                {label}
              </Text>
            </Flex>
          )
        })}
      </Flex>
    </FormField>
  )
}
