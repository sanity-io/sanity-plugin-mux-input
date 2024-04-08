import {CalendarIcon, ClockIcon, TagIcon} from '@sanity/icons'
import {Inline, Stack, Text} from '@sanity/ui'

import getVideoMetadata from '../util/getVideoMetadata'
import type {VideoAssetDocument} from '../util/types'
import IconInfo from './IconInfo'

const VideoMetadata = (props: {asset: VideoAssetDocument}) => {
  if (!props.asset) {
    return null
  }

  const displayInfo = getVideoMetadata(props.asset)
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
          <IconInfo text={displayInfo.duration} icon={ClockIcon} size={1} muted />
        )}
        <IconInfo
          text={displayInfo.createdAt.toISOString().split('T')[0]}
          icon={CalendarIcon}
          size={1}
          muted
        />
        {displayInfo.title != displayInfo.id.slice(0, 12) && (
          <IconInfo text={displayInfo.id.slice(0, 12)} icon={TagIcon} size={1} muted />
        )}
      </Inline>
    </Stack>
  )
}

export default VideoMetadata
