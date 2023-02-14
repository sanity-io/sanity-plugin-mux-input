import {type InputProps, isObjectInputProps, type PreviewLayoutKey, type PreviewProps} from 'sanity'

import type {MuxInputPreviewProps, MuxInputProps} from './types'

export function isMuxInputProps(props: InputProps): props is MuxInputProps {
  return isObjectInputProps(props) && props.schemaType.type?.name === 'mux.video'
}

export function isMuxInputPreviewProps(
  props: PreviewProps<PreviewLayoutKey>
): props is MuxInputPreviewProps {
  return props.schemaType?.type?.name === 'mux.video'
}
