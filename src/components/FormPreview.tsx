import React, {lazy, memo} from 'react'
import {PreviewLayoutKey, PreviewProps} from 'sanity'

import {isMuxInputPreviewProps} from '../util/asserters'
import {AspectRatioCard} from './Input.styled'

const Preview = lazy(() => import('./Preview'))

export default memo(function FormPreview(props: PreviewProps<PreviewLayoutKey>) {
  if (isMuxInputPreviewProps(props)) {
    return (
      <AspectRatioCard>
        {/* @ts-expect-error */}
        <Preview {...props} />
      </AspectRatioCard>
    )
  }
  return props.renderDefault(props)
})
