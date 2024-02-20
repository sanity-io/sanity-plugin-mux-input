import {CloseIcon, UploadIcon} from '@sanity/icons'
import {Button, Card, Checkbox, Dialog, Flex, Radio, Stack, Text, TextInput} from '@sanity/ui'
import {useId, useState} from 'react'
import {ENCODING_TIERS, PluginConfig, Secrets, UploadConfig} from '../util/types'
import FormField from './FormField'
import TextTracksEditor from './TextTracksEditor'

export default function UploadConfiguration({
  secrets,
  pluginConfig,
  uploadConfig: config,
  setUploadConfig,
  startUpload,
  file,
  cancelUpload,
}: {
  secrets: Secrets
  uploadConfig: UploadConfig
  setUploadConfig: (newConfig: UploadConfig) => void
  pluginConfig: PluginConfig
  startUpload: () => void
  file?: File
  cancelUpload: () => void
}) {
  const id = useId()
  const [videoUrl] = useState(() => {
    return file && URL.createObjectURL(file)
  })

  function modifyProperty(newValues: Partial<UploadConfig>) {
    setUploadConfig({
      ...config,
      ...newValues,
    })
  }

  const titleId = `${id}--title`
  return (
    <Dialog
      open
      onClose={cancelUpload}
      id="upload-configuration"
      zOffset={1000}
      width={4}
      header="Configure upload"
      __unstable_autoFocus
      footer={
        <Card padding={3}>
          <Flex justify="flex-end" align="center" gap={3}>
            <Button text="Cancel" icon={CloseIcon} onClick={cancelUpload} mode="bleed" />
            <Button
              icon={UploadIcon}
              text="Upload"
              tone="positive"
              disabled={!config.title}
              onClick={startUpload}
            />
          </Flex>
        </Card>
      }
    >
      <Stack space={4} padding={2}>
        {videoUrl && (
          <Flex gap={2} align="center">
            <Card
              sizing="border"
              radius={2}
              overflow="hidden"
              style={{width: '100px', height: '100px'}}
            >
              <video
                src={videoUrl}
                style={{width: '100%', height: '100%', objectFit: 'contain'}}
                tabIndex={10}
              ></video>
            </Card>
            {file?.name && <Text muted>{file?.name}</Text>}
          </Flex>
        )}
        <Stack
          space={4}
          style={{
            position: 'sticky',
            top: '1em',
          }}
          flex={1}
          as="form"
          sizing="border"
        >
          <FormField title="Video title" inputId={titleId}>
            <TextInput
              id={titleId}
              onChange={(e) => modifyProperty({title: e.currentTarget.value})}
              type="text"
              value={config.title || ''}
              tabIndex={0}
            />
          </FormField>
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
          <fieldset style={{all: 'unset'}}>
            <Stack space={2}>
              <Text as="legend" size={1} weight="semibold">
                Encoding tier
              </Text>
              {ENCODING_TIERS.map(({value, label}) => {
                const inputId = `${id}--encoding_tier-${value}`

                return (
                  <Flex key={value} align="center" gap={2}>
                    <Radio
                      checked={config.encoding_tier === value}
                      name="encoding_tier"
                      onChange={(e) => {
                        modifyProperty({
                          encoding_tier: e.currentTarget.value as UploadConfig['encoding_tier'],
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
                  Max resolution
                </Text>
                {getResolutionOptions(pluginConfig).map(({value, label}) => {
                  const inputId = `${id}--max_resolution-${value}`
                  return (
                    <Flex key={value} align="center" gap={2}>
                      <Radio
                        checked={config.max_resolution_tier === value}
                        name="max_resolution"
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
        </Stack>
      </Stack>
    </Dialog>
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
