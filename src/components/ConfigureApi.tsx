import {useId} from '@reach/auto-id'
import {Box, Button, Card, Checkbox, Code, Flex, Inline, Stack, Text, TextInput} from '@sanity/ui'
import {Dialog} from '@sanity/ui'
import React, {memo, useCallback, useEffect, useMemo, useReducer, useRef} from 'react'
import {unstable_batchedUpdates} from 'react-dom'
import {useClient} from 'sanity'
import styled from 'styled-components'

import {readSecrets} from '../util/readSecrets'
import type {Secrets} from '../util/types'
import FormField from './FormField'
import MuxLogo from './MuxLogo'

const Logo = styled.span`
  display: inline-block;
  height: 0.8em;
  margin-right: 1em;
  transform: translate(0.3em, -0.2em);
`

export interface State extends Pick<Secrets, 'token' | 'secretKey' | 'enableSignedUrls'> {
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
function init({token, secretKey, enableSignedUrls}: Secrets): State {
  return {
    submitting: false,
    error: null,
    // Form inputs don't set the state back to null when clearing a field, but uses empty strings
    // This ensures the `dirty` check works correctly
    token: token || '',
    secretKey: secretKey || '',
    enableSignedUrls,
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
      throw new Error(`Unknown action type: ${(action as any)?.type}`)
  }
}

export interface Props {
  onClose: () => void
}
const fieldNames = ['token', 'secretKey', 'enableSignedUrls'] as const
function ConfigureApi({onClose}: Props) {
  const client = useClient()
  const secrets = readSecrets(client)
  const [state, dispatch] = useReducer(reducer, secrets, init)
  const hasSecretsInitially = useMemo(() => secrets.token && secrets.secretKey, [secrets])
  const dirty = useMemo(
    () =>
      secrets.token !== state.token ||
      secrets.secretKey !== state.secretKey ||
      secrets.enableSignedUrls !== state.enableSignedUrls,
    [secrets, state]
  )
  const id = `ConfigureApi${useId()}`
  const [tokenId, secretKeyId, enableSignedUrlsId] = useMemo<typeof fieldNames>(
    () => fieldNames.map((field) => `${id}-${field}`) as unknown as typeof fieldNames,
    [id]
  )
  const firstField = useRef<HTMLInputElement>(null)
  const saveSecrets = useSaveSecrets()
  const saving = useRef(false)

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (!saving.current) {
        saving.current = true
        dispatch({type: 'submit'})
        const {token, secretKey, enableSignedUrls} = state
        saveSecrets({token, secretKey, enableSignedUrls})
          .then(() => void unstable_batchedUpdates(() => onClose()))
          .catch(
            (err) =>
              void unstable_batchedUpdates(() => dispatch({type: 'error', payload: err.message}))
          )
          .finally(() => {
            saving.current = false
          })
      }
    },
    [saveSecrets, state]
  )
  const handleChangeToken = useCallback((event: React.FormEvent<HTMLInputElement>) => {
    dispatch({type: 'change', payload: {name: 'token', value: event.currentTarget.value}})
  }, [])
  const handleChangeSecretKey = useCallback((event: React.FormEvent<HTMLInputElement>) => {
    dispatch({type: 'change', payload: {name: 'secretKey', value: event.currentTarget.value}})
  }, [])
  const handleChangeEnableSignedUrls = useCallback((event: React.FormEvent<HTMLInputElement>) => {
    dispatch({
      type: 'change',
      payload: {name: 'enableSignedUrls', value: event.currentTarget.checked},
    })
  }, [])

  const header = useMemo(
    () => (
      <>
        <Logo>
          <MuxLogo />
        </Logo>
        API Credentials
      </>
    ),
    []
  )

  useEffect(() => {
    if (firstField.current) {
      firstField.current.focus()
    }
  }, [firstField])

  return (
    <Dialog id={id} header={header} width={1} onClose={onClose}>
      <Box
        paddingRight={4}
        paddingLeft={4}
        paddingBottom={4}
        paddingTop={4}
        style={{position: 'relative'}}
      >
        <form onSubmit={handleSubmit}>
          <Stack space={4}>
            {!hasSecretsInitially && (
              <Card padding={[3, 3, 3]} radius={2} shadow={1} tone="primary">
                <Stack space={3}>
                  <Text size={1}>
                    To set up a new access token, go to your{' '}
                    <a
                      href="https://dashboard.mux.com/settings/access-tokens"
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      account on mux.com
                    </a>
                    .
                  </Text>
                  <Text size={1}>
                    The access token needs permissions: <strong>Mux Video </strong>
                    (Full Access) and <strong>Mux Data</strong> (Read)
                    <br />
                    The credentials will be stored safely in a hidden document only available to
                    editors.
                  </Text>
                </Stack>
              </Card>
            )}
            <FormField title="Access Token" inputId={tokenId}>
              <TextInput
                id={tokenId}
                ref={firstField}
                onChange={handleChangeToken}
                type="text"
                value={state.token}
              />
            </FormField>
            <FormField title="Secret Key" inputId={secretKeyId}>
              <TextInput
                id={secretKeyId}
                onChange={handleChangeSecretKey}
                type="text"
                value={state.secretKey}
              />
            </FormField>

            <Stack space={4}>
              <Flex align="center">
                <Checkbox
                  id={enableSignedUrlsId}
                  onChange={handleChangeEnableSignedUrls}
                  checked={state.enableSignedUrls}
                  style={{display: 'block'}}
                />
                <Box flex={1} paddingLeft={3}>
                  <Text>
                    <label htmlFor={enableSignedUrlsId}>Enable Signed Urls</label>
                  </Text>
                </Box>
              </Flex>
              {/* TODO: use a popover instead to avoid jumping around */}
              {secrets.signingKeyId && state.enableSignedUrls ? (
                <Card padding={[3, 3, 3]} radius={2} shadow={1} tone="caution">
                  <Stack space={3}>
                    <Text size={1}>The signing key ID that Sanity will use is:</Text>
                    <Code size={1}>{secrets.signingKeyId}</Code>
                    <Text size={1}>
                      This key is only used for previewing content in the Sanity UI.
                      <br />
                      You should generate a different key to use in your application server.
                    </Text>
                  </Stack>
                </Card>
              ) : null}
            </Stack>

            <Inline space={2}>
              <Button
                text="Save"
                disabled={!dirty}
                loading={state.submitting}
                tone="primary"
                mode="default"
                type="submit"
              />
              <Button disabled={state.submitting} text="Cancel" mode="bleed" onClick={onClose} />
            </Inline>
            {state.error && (
              <Card padding={[3, 3, 3]} radius={2} shadow={1} tone="critical">
                <Text>{state.error}</Text>
              </Card>
            )}
          </Stack>
        </form>
      </Box>
    </Dialog>
  )
}

export default memo(ConfigureApi)
