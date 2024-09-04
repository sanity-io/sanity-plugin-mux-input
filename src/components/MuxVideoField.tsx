import {useMemo} from 'react'
import {ObjectFieldProps} from 'sanity'

export function MuxVideoField(props: ObjectFieldProps) {
  const propsWithoutLeftBorder = useMemo(() => ({...props, level: props.level - 1}), [props])

  return props.renderDefault(propsWithoutLeftBorder)
}
