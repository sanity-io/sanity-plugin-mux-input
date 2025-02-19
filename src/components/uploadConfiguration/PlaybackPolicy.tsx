import {Text} from '@sanity/ui'

import {Secrets, UploadConfig} from '../../util/types'
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
  dispatch: any
}) {
  return (
    <>
      <Text weight="bold">Advanced Playback Policies</Text>
      <PlaybackPolicyOption
        id={`${id}--public`}
        checked={config.public_policy}
        optionName="Public"
        description="Playback IDs are accessible by constructing an HLS URL like https://stream.mux.com/{PLAYBACK_ID}"
        dispatch={dispatch}
        action="public_policy"
      />
      {secrets.enableSignedUrls && (
        <PlaybackPolicyOption
          id={`${id}--signed`}
          checked={config.signed_policy}
          optionName="Signed"
          description="Playback IDs should be used with tokens https://stream.mux.com/{PLAYBACK_ID}?token={TOKEN}. 
                // See Secure video playback for details about creating tokens."
          dispatch={dispatch}
          action="signed_policy"
        />
      )}
      {!(config.public_policy || config.signed_policy) && <PlaybackPolicyWarning />}
    </>
  )
}
