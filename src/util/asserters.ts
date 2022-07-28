// eslint-disable-next-line no-warning-comments
// @TODO use this asserter, when it's available in a nvew dev-preview
// import {isObjectInputProps} from 'sanity'
import {type InputProps, isObjectSchemaType} from 'sanity'

import {name} from '../schema/mux.video'
import type {MuxInputProps} from './types'

export function isMuxInputProps(props: InputProps): props is MuxInputProps {
  return isObjectSchemaType(props.schemaType) && props.schemaType.type?.name === name
}
