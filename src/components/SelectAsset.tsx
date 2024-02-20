import React, {useCallback} from 'react'
import {PatchEvent, set, setIfMissing, unset} from 'sanity'

import type {SetDialogState} from '../hooks/useDialogState'
import type {MuxInputProps, VideoAssetDocument} from '../util/types'
import VideosBrowser, {type VideosBrowserProps} from './VideosBrowser'

export interface Props extends Pick<MuxInputProps, 'onChange'> {
  asset?: VideoAssetDocument | null | undefined
  setDialogState: SetDialogState
}

export default function SelectAssets({asset: selectedAsset, onChange, setDialogState}: Props) {
  const handleSelect = useCallback<Required<VideosBrowserProps>['onSelect']>(
    (chosenAsset) => {
      if (!chosenAsset?._id) {
        onChange(PatchEvent.from([unset(['asset'])]))
      }
      if (chosenAsset._id !== selectedAsset?._id) {
        onChange(
          PatchEvent.from([
            setIfMissing({asset: {}, _type: 'mux.video'}),
            set({_type: 'reference', _weak: true, _ref: chosenAsset._id}, ['asset']),
          ])
        )
      }
      setDialogState(false)
    },
    [onChange, setDialogState, selectedAsset]
  )

  return <VideosBrowser onSelect={handleSelect} />
}
