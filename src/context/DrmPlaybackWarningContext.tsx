import {Button, Dialog, Stack, Text} from '@sanity/ui'
import React, {createContext, useContext, useState} from 'react'

import {PluginConfig} from '../util/types'

const LOCAL_STORAGE_HAS_SHOWN_WARNING_KEY = 'mux-plugin-has-shown-drm-playback-warning'

type DrmPlaybackWarningContextContextProps = {
  hasShownWarning: boolean
  setHasWarnedAboutDrmPlayback: (b: boolean) => void
}

const DrmPlaybackWarningContext = createContext<DrmPlaybackWarningContextContextProps>({
  hasShownWarning: false,
  setHasWarnedAboutDrmPlayback: () => {
    return null
  },
})

interface DrmPlaybackWarningContextProviderProps {
  config?: PluginConfig
  children: React.ReactNode
}

export const DrmPlaybackWarningContextProvider = ({
  config,
  children,
}: DrmPlaybackWarningContextProviderProps) => {
  const warningDisabled = config?.disableDrmPlaybackWarning ?? false
  const hasWarned: boolean =
    warningDisabled || window.localStorage.getItem(LOCAL_STORAGE_HAS_SHOWN_WARNING_KEY) === 'true'
  const [hasWarnedAboutDrmPlayback, setHasWarnedAboutDrmPlayback] = useState(hasWarned)

  const setHasShownWarning = (b: boolean) => {
    window.localStorage.setItem(LOCAL_STORAGE_HAS_SHOWN_WARNING_KEY, b.toString())
    setHasWarnedAboutDrmPlayback(b)
  }
  return (
    <DrmPlaybackWarningContext.Provider
      value={{
        hasShownWarning: hasWarnedAboutDrmPlayback,
        setHasWarnedAboutDrmPlayback: setHasShownWarning,
      }}
    >
      {children}
    </DrmPlaybackWarningContext.Provider>
  )
}

export const useDrmPlaybackWarningContext = () => {
  const context = useContext(DrmPlaybackWarningContext)
  return context
}

export const DRMWarningDialog = ({onClose}: {onClose: () => void}) => {
  const {setHasWarnedAboutDrmPlayback} = useDrmPlaybackWarningContext()
  const _onClose = () => {
    setHasWarnedAboutDrmPlayback(true)
    onClose()
  }
  return (
    <Dialog
      open
      id="drm-playback-warn"
      onClose={_onClose}
      header="DRM Playback Warning"
      footer={
        <Stack padding={3}>
          <Button mode="ghost" tone="primary" onClick={_onClose} text="Ok" />
        </Stack>
      }
    >
      <Stack space={3} padding={3}>
        <Text size={1} weight="semibold">
          Playing DRM protected content will issue a license which infers a small cost
        </Text>
        <Text size={1} weight="semibold">
          This is a one time warning. You can disable this in the plugin config.
        </Text>
      </Stack>
    </Dialog>
  )
}
