import {Box, Card, Spinner} from '@sanity/ui'

import {THUMBNAIL_ASPECT_RATIO} from '../util/constants'

export default function VideoThumbnailFallback({width}: {width?: number}) {
  return (
    <Card
      style={{
        aspectRatio: THUMBNAIL_ASPECT_RATIO,
        position: 'relative',
        maxWidth: width ? `${width}px` : undefined,
        width: '100%',
        flex: 1,
      }}
      border
      radius={2}
      tone="transparent"
    >
      <Box
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <Spinner />
      </Box>
    </Card>
  )
}
