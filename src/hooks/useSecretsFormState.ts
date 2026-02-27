import {useReducer} from 'react'

import type {Secrets} from '../util/types'

export interface State
  extends Pick<Secrets, 'token' | 'secretKey' | 'enableSignedUrls' | 'drmConfigId'> {
  submitting: boolean
  error: string | null
}
export type Action =
  | {type: 'submit'}
  | {type: 'error'; payload: string}
  | {type: 'reset'; payload: Secrets}
  | {type: 'change'; payload: {name: 'token'; value: string}}
  | {type: 'change'; payload: {name: 'secretKey'; value: string}}
  | {type: 'change'; payload: {name: 'enableSignedUrls'; value: boolean}}
  | {type: 'change'; payload: {name: 'drmConfigId'; value: string}}
function init({token, secretKey, enableSignedUrls, drmConfigId}: Secrets): State {
  return {
    submitting: false,
    error: null,
    // Form inputs don't set the state back to null when clearing a field, but uses empty strings
    // This ensures the `dirty` check works correctly
    token: token ?? '',
    secretKey: secretKey ?? '',
    enableSignedUrls: enableSignedUrls ?? false,
    drmConfigId: drmConfigId ?? '',
  }
}
function reducer(state: State, action: Action) {
  switch (action?.type) {
    case 'submit':
      return {...state, submitting: true, error: null}
    case 'error':
      return {...state, submitting: false, error: action.payload}
    case 'reset':
      return init(action.payload)
    case 'change':
      return {...state, [action.payload.name]: action.payload.value}
    default:
      throw new Error(`Unknown action type: ${(action as unknown as Action)?.type}`)
  }
}

export const useSecretsFormState = (secrets: Secrets) => useReducer(reducer, secrets, init)
