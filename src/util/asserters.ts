// eslint-disable-next-line no-warning-comments
// @TODO use this asserter, when it's available in a nvew dev-preview
// import {isObjectInputProps} from 'sanity'
import {
  type InputProps,
  type PreviewProps,
  type SchemaType,
  isObjectSchemaType,
} from 'sanity'

import type {MuxInputPreviewProps, MuxInputProps} from './types'

export function isMuxInputProps(props: InputProps): props is MuxInputProps {
  return (
    isObjectSchemaType(props.schemaType) &&
    props.schemaType.type?.name === 'mux.video'
  )
}

// @TODO extract props typing from renderPreview first arg
export function isMuxInputPreviewProps(
  props: PreviewProps & {schemaType: SchemaType}
): props is MuxInputPreviewProps {
  return props.schemaType.type?.name === name
}
