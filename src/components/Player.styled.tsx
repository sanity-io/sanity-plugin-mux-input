import {useState} from 'react'
import {styled} from 'styled-components'

import {useClient} from '../hooks/useClient'
import {getStoryboardSrc} from '../util/getStoryboardSrc'
import type {VideoAssetDocument} from '../util/types'

export const StyledCenterControls = styled.div`
  && {
    --media-background-color: transparent;
    --media-button-icon-width: 100%;
    --media-button-icon-height: auto;
    pointer-events: none;
    width: 100%;
    display: flex;
    flex-flow: row;
    align-items: center;
    justify-content: center;
    media-play-button {
      --media-control-background: transparent;
      --media-control-hover-background: transparent;
      padding: 0;
      width: max(27px, min(9%, 90px));
    }
  }
`

export const TopControls = styled.div`
  position: absolute;
  top: 0;
  right: 0;
  justify-content: flex-end;
  button {
    height: auto;
  }
`

export interface PosterImageProps {
  asset: VideoAssetDocument
}
export interface ThumbnailsMetadataTrackProps {
  asset: VideoAssetDocument
}
export function ThumbnailsMetadataTrack({asset}: ThumbnailsMetadataTrackProps) {
  const client = useClient()
  // Why useState instead of useMemo? Because we really really only want to run it exactly once and useMemo doesn't make that guarantee
  const [src] = useState<string>(() => getStoryboardSrc({asset, client}))

  return <track label="thumbnails" default kind="metadata" src={src} />
}
