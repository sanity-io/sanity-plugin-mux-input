import {UploadIcon} from '@sanity/icons'
import {Button, Card, Checkbox, Flex, Radio, Stack, Text} from '@sanity/ui'
import {useId} from 'react'
import {PluginConfig, Secrets, UploadConfig} from '../util/types'
import TextTracksEditor from './TextTracksEditor'

export default function UploadConfiguration({
  secrets,
  pluginConfig,
  uploadConfig: config,
  setUploadConfig,
  startUpload,
}: {
  secrets: Secrets
  uploadConfig: UploadConfig
  setUploadConfig: (newConfig: UploadConfig) => void
  pluginConfig: PluginConfig
  startUpload: () => void
}) {
  const id = useId()

  function modifyProperty(newValues: Partial<UploadConfig>) {
    setUploadConfig({
      ...config,
      ...newValues,
    })
  }

  return (
    <Card border paddingX={3} paddingY={4}>
      <Stack space={4}>
        {secrets.enableSignedUrls && (
          <Flex align="center" gap={2}>
            <Checkbox
              id={`${id}--signed`}
              style={{display: 'block'}}
              name="signed"
              required
              checked={config.signed}
              onChange={(e) => {
                modifyProperty({
                  signed: e.currentTarget.checked,
                })
              }}
            />
            <Text>
              <label htmlFor={`${id}--signed`}>Signed playback URL</label>
            </Text>
          </Flex>
        )}

        <Flex align="center" gap={2}>
          <Checkbox
            id={`${id}--encoding_tier`}
            style={{display: 'block'}}
            name="encoding_tier"
            required
            checked={config.encoding_tier === 'smart'}
            onChange={(e) => {
              modifyProperty({
                encoding_tier: e.currentTarget.checked ? 'smart' : 'baseline',
              })
            }}
          />
          <Text>
            <label htmlFor={`${id}--encoding_tier`}>Smart encoding</label>
          </Text>
        </Flex>

        {config.encoding_tier === 'smart' && pluginConfig.mp4_support !== 'none' && (
          <Flex align="center" gap={2}>
            <Checkbox
              id={`${id}--mp4_support`}
              style={{display: 'block'}}
              name="mp4_support"
              required
              checked={config.mp4_support === 'standard'}
              onChange={(e) => {
                modifyProperty({
                  mp4_support: e.currentTarget.checked ? 'standard' : 'none',
                })
              }}
            />
            <Text>
              <label htmlFor={`${id}--mp4_support`}>MP4 support (allow downloading)</label>
            </Text>
          </Flex>
        )}

        {config.encoding_tier === 'smart' && pluginConfig.max_resolution_tier !== '1080p' && (
          <fieldset style={{all: 'unset'}}>
            <Stack space={2}>
              <Text as="legend" size={1} weight="semibold">
                Type
              </Text>
              {getResolutionOptions(pluginConfig).map(({value, label}) => {
                const inputId = `${id}--type-${value}`
                return (
                  <Flex key={value} align="center" gap={2}>
                    <Radio
                      checked={config.max_resolution_tier === value}
                      name="track-type"
                      onChange={(e) => {
                        modifyProperty({
                          max_resolution_tier: e.currentTarget
                            .value as UploadConfig['max_resolution_tier'],
                        })
                      }}
                      value={value}
                      id={inputId}
                    />
                    <Text as="label" htmlFor={inputId}>
                      {label}
                    </Text>
                  </Flex>
                )
              })}
            </Stack>
          </fieldset>
        )}

        <TextTracksEditor
          tracks={config.text_tracks || []}
          setTracks={(newTracks) => {
            modifyProperty({
              text_tracks: newTracks as UploadConfig['text_tracks'],
            })
          }}
        />

        <Button icon={UploadIcon} text="Upload" tone="positive" onClick={startUpload} />
      </Stack>
    </Card>
  )
}

function getResolutionOptions({max_resolution_tier}: PluginConfig) {
  return [
    {value: '1080p', label: '1080p'},
    max_resolution_tier !== '1080p' && {value: '1440p', label: '1440p (2k)'},
    max_resolution_tier !== '1080p' &&
      max_resolution_tier !== '1440p' && {value: '2160p', label: '2160p (4k)'},
  ].filter(Boolean) as {value: PluginConfig['max_resolution_tier']; label: string}[]
}
