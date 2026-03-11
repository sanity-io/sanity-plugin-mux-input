import {Checkbox, Flex, Label, Radio, Stack, Text} from '@sanity/ui'
import {ActionDispatch, useMemo, useState} from 'react'
import {FormField} from 'sanity'

import {type StaticRenditionResolution, type UploadConfig} from '../../util/types'
import {UploadConfigurationStateAction} from '../UploadConfiguration'

const ADVANCED_RESOLUTIONS: {value: StaticRenditionResolution; label: string}[] = [
  {value: '270p', label: '270p'},
  {value: '360p', label: '360p'},
  {value: '480p', label: '480p'},
  {value: '540p', label: '540p'},
  {value: '720p', label: '720p'},
  {value: '1080p', label: '1080p'},
  {value: '1440p', label: '1440p'},
  {value: '2160p', label: '2160p'},
]

export const StaticRenditionSelector = ({
  id,
  config,
  dispatch,
}: {
  id: string
  config: UploadConfig
  dispatch: ActionDispatch<[action: UploadConfigurationStateAction]>
}) => {
  // Determine if user is in advanced mode based on selected renditions
  const isAdvancedMode = useMemo(() => {
    const specificResolutions = config.static_renditions.filter(
      (r) => r !== 'highest' && r !== 'audio-only'
    )
    return specificResolutions.length > 0
  }, [config.static_renditions])

  const [renditionMode, setRenditionMode] = useState<'standard' | 'advanced'>(
    isAdvancedMode ? 'advanced' : 'standard'
  )

  // Helper to toggle a rendition
  const toggleRendition = (rendition: StaticRenditionResolution) => {
    const current = config.static_renditions
    const hasRendition = current.includes(rendition)

    if (hasRendition) {
      dispatch({
        action: 'static_renditions',
        value: current.filter((r) => r !== rendition),
      })
    } else {
      dispatch({
        action: 'static_renditions',
        value: [...current, rendition],
      })
    }
  }

  // When switching modes, clear renditions that don't apply
  const handleModeChange = (mode: 'standard' | 'advanced') => {
    setRenditionMode(mode)
    if (mode === 'standard') {
      // Remove specific resolutions, keep only highest and audio-only
      dispatch({
        action: 'static_renditions',
        value: config.static_renditions.filter((r) => r === 'highest' || r === 'audio-only'),
      })
    } else {
      // Remove highest, keep specific resolutions and audio-only
      dispatch({
        action: 'static_renditions',
        value: config.static_renditions.filter((r) => r !== 'highest'),
      })
    }
  }
  return (
    <Stack space={3}>
      <FormField
        title="Static Renditions"
        description="Generate downloadable MP4 or M4A files. Note: Mux will not upscale to produce MP4 renditions - renditions that would cause upscaling are skipped."
      >
        <Stack space={3}>
          {/* Mode Selector */}
          <Flex gap={3}>
            <Flex align="center" gap={2}>
              <Radio
                checked={renditionMode === 'standard'}
                name="rendition-mode"
                onChange={() => handleModeChange('standard')}
                value="standard"
                id={`${id}--mode-standard`}
              />
              <Text as="label" htmlFor={`${id}--mode-standard`}>
                Standard
              </Text>
            </Flex>
            <Flex align="center" gap={2}>
              <Radio
                checked={renditionMode === 'advanced'}
                name="rendition-mode"
                onChange={() => handleModeChange('advanced')}
                value="advanced"
                id={`${id}--mode-advanced`}
              />
              <Text as="label" htmlFor={`${id}--mode-advanced`}>
                Advanced
              </Text>
            </Flex>
          </Flex>

          {/* Standard Mode Options */}
          {renditionMode === 'standard' && (
            <Stack space={2}>
              <Flex align="center" gap={2} padding={[0, 2]}>
                <Checkbox
                  id={`${id}--highest`}
                  style={{display: 'block'}}
                  checked={config.static_renditions.includes('highest')}
                  onChange={() => toggleRendition('highest')}
                />
                <Text as="label" htmlFor={`${id}--highest`}>
                  Highest Resolution (up to 4K)
                </Text>
              </Flex>
              <Flex align="center" gap={2} padding={[0, 2]}>
                <Checkbox
                  id={`${id}--audio-only-standard`}
                  style={{display: 'block'}}
                  checked={config.static_renditions.includes('audio-only')}
                  onChange={() => toggleRendition('audio-only')}
                />
                <Text as="label" htmlFor={`${id}--audio-only-standard`}>
                  Audio Only (M4A)
                </Text>
              </Flex>
            </Stack>
          )}

          {/* Advanced Mode Options */}
          {renditionMode === 'advanced' && (
            <Stack space={2}>
              <Label size={1} muted>
                Select specific resolutions:
              </Label>
              <Flex gap={2} wrap="wrap">
                {ADVANCED_RESOLUTIONS.map(({value, label}) => {
                  const inputId = `${id}--resolution-${value}`
                  return (
                    <Flex key={value} align="center" gap={2}>
                      <Checkbox
                        id={inputId}
                        style={{display: 'block'}}
                        checked={config.static_renditions.includes(value)}
                        onChange={() => toggleRendition(value)}
                      />
                      <Text as="label" htmlFor={inputId} size={1}>
                        {label}
                      </Text>
                    </Flex>
                  )
                })}
              </Flex>
              <Flex align="center" gap={2} padding={[2, 2, 0, 2]}>
                <Checkbox
                  id={`${id}--audio-only-advanced`}
                  style={{display: 'block'}}
                  checked={config.static_renditions.includes('audio-only')}
                  onChange={() => toggleRendition('audio-only')}
                />
                <Text as="label" htmlFor={`${id}--audio-only-advanced`}>
                  Audio Only (M4A)
                </Text>
              </Flex>
            </Stack>
          )}
        </Stack>
      </FormField>
    </Stack>
  )
}
