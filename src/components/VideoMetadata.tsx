import {CalendarIcon, ClockIcon} from '@sanity/icons'
import {Inline, Stack, Text} from '@sanity/ui'
import React from 'react'

import getVideoMetadata from '../util/getVideoMetadata'
import {VideoAssetDocument} from '../util/types'
import IconInfo from './IconInfo'

const VideoMetadata = (props: {asset: VideoAssetDocument}) => {
  if (!props.asset) {
    return null
  }

  const displayInfo = getVideoMetadata(props.asset, false)
  return (
    <Stack space={2}>
      {displayInfo.title && (
        <Text
          size={1}
          weight="semibold"
          style={{
            wordWrap: 'break-word',
          }}
        >
          {displayInfo.title}
        </Text>
      )}
      <Inline space={3}>
        {displayInfo?.duration && (
          <IconInfo text={displayInfo.duration} icon={ClockIcon} size={2} muted />
        )}
        <IconInfo
          text={displayInfo.createdAt.toISOString().split('T')[0]}
          icon={CalendarIcon}
          size={2}
          muted
        />
      </Inline>
    </Stack>
  )
}

export default VideoMetadata
