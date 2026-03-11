import {Code, Grid, Text} from '@sanity/ui'
import {ActionDispatch} from 'react'

import {Secrets, UploadConfig} from '../../util/types'
import {UploadConfigurationStateAction} from '../UploadConfiguration'
import PlaybackPolicyOption from './PlaybackPolicyOption'
import PlaybackPolicyWarning from './PlaybackPolicyWarning'

export default function PlaybackPolicy({
  id,
  config,
  secrets,
  dispatch,
}: {
  id: string
  config: UploadConfig
  secrets: Secrets
  dispatch: ActionDispatch<[action: UploadConfigurationStateAction]>
}) {
  const noPolicySelected = !(config.public_policy || config.signed_policy || config.drm_policy)
  const drmPolicyDisabled = !secrets.drmConfigId
  return (
    <Grid gap={3}>
      <Text weight="bold">Advanced Playback Policies</Text>
      <PlaybackPolicyOption
        id={`${id}--public`}
        checked={config.public_policy}
        optionName="Public"
        description={
          <>
            <Text size={2} muted>
              Playback IDs are accessible by constructing an HLS URL like
            </Text>
            <Code>{'https://stream.mux.com/{PLAYBACK_ID}'}</Code>
          </>
        }
        dispatch={dispatch}
        action="public_policy"
      />
      {secrets.enableSignedUrls && (
        <PlaybackPolicyOption
          id={`${id}--signed`}
          checked={config.signed_policy}
          optionName="Signed"
          description={
            <>
              <Text size={2} muted>
                Playback IDs should be used with tokens
              </Text>
              <Code>{'https://stream.mux.com/{PLAYBACK_ID}?token={TOKEN}'}</Code>
              <Text size={2} muted>
                See{' '}
                <a
                  href="https://www.mux.com/docs/guides/secure-video-playback"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Secure video playback
                </a>{' '}
                for details about creating tokens.
              </Text>
            </>
          }
          // See Secure video playback for details about creating tokens."
          dispatch={dispatch}
          action="signed_policy"
        />
      )}
      {drmPolicyDisabled ? (
        <PlaybackPolicyOption
          id={`${id}--drm`}
          checked={false}
          optionName="DRM - Disabled"
          description={
            <>
              <Text size={2} muted>
                To enable DRM add your DRM Configuration Id to your plugin configuration in the API
                Credentials view.{' '}
                <a
                  href="https://www.mux.com/support/human"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Contact us
                </a>{' '}
                to get started using DRM.
              </Text>
            </>
          }
          dispatch={dispatch}
          disabled
        />
      ) : (
        <PlaybackPolicyOption
          id={`${id}--drm`}
          checked={config.drm_policy}
          optionName="DRM"
          description={
            <>
              <Text size={2} muted>
                Playback IDs should be used with tokens as with Signed playback, but require extra
                configuration.
              </Text>
              <Code>{'https://stream.mux.com/{PLAYBACK_ID}?token={TOKEN}'}</Code>
              <Text size={2} muted>
                See{' '}
                <a
                  href="https://www.mux.com/docs/guides/protect-videos-with-drm#play-drm-protected-videos"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Protect videos with DRM
                </a>{' '}
                for details about configuring your player for DRM playback and{' '}
                <a
                  href="https://www.mux.com/docs/guides/secure-video-playback"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Secure video playback
                </a>{' '}
                for details about creating tokens.
              </Text>
            </>
          }
          dispatch={dispatch}
          action="drm_policy"
        />
      )}
      {noPolicySelected && <PlaybackPolicyWarning />}
    </Grid>
  )
}
