import {
  Box,
  Button,
  Card,
  Checkbox,
  Code,
  Dialog,
  Flex,
  Inline,
  Stack,
  Text,
  TextInput,
} from '@sanity/ui'
import {useCallback, useEffect, useId, useMemo, useRef} from 'react'
import {clear, preload} from 'suspend-react'

import {useClient} from '../hooks/useClient'
import type {SetDialogState} from '../hooks/useDialogState'
import {useDialogState} from '../hooks/useDialogState'
import {useSaveSecrets} from '../hooks/useSaveSecrets'
import {useSecretsDocumentValues} from '../hooks/useSecretsDocumentValues'
import {useSecretsFormState} from '../hooks/useSecretsFormState'
import {cacheNs, DIALOGS_Z_INDEX} from '../util/constants'
import {_id as secretsId} from '../util/readSecrets'
import type {Secrets} from '../util/types'
import {Header} from './ConfigureApi.styled'
import FormField from './FormField'

// Props for the dialog component when used with external state management
export interface ConfigureApiDialogProps {
  setDialogState: SetDialogState
  secrets: Secrets
}

const fieldNames = ['token', 'secretKey', 'enableSignedUrls', 'drmConfigId'] as const

// Internal dialog component that can be used with external state
export function ConfigureApiDialog({secrets, setDialogState}: ConfigureApiDialogProps) {
  const client = useClient()
  const [state, dispatch] = useSecretsFormState(secrets)
  const hasSecretsInitially = useMemo(() => secrets.token && secrets.secretKey, [secrets])
  const handleClose = useCallback(() => setDialogState(false), [setDialogState])
  const dirty = useMemo(
    () =>
      secrets.token !== state.token ||
      secrets.secretKey !== state.secretKey ||
      secrets.enableSignedUrls !== state.enableSignedUrls ||
      secrets.drmConfigId !== state.drmConfigId,
    [secrets, state]
  )
  const id = `ConfigureApi${useId()}`
  const [tokenId, secretKeyId, enableSignedUrlsId, drmConfigIdId] = useMemo<typeof fieldNames>(
    () => fieldNames.map((field) => `${id}-${field}`) as unknown as typeof fieldNames,
    [id]
  )
  const firstField = useRef<HTMLInputElement>(null)
  const handleSaveSecrets = useSaveSecrets(client, secrets)
  const saving = useRef(false)

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (!saving.current && event.currentTarget.reportValidity()) {
        saving.current = true
        dispatch({type: 'submit'})
        const {token, secretKey, enableSignedUrls, drmConfigId} = state
        handleSaveSecrets({token, secretKey, enableSignedUrls, drmConfigId})
          .then((savedSecrets) => {
            const {projectId, dataset} = client.config()
            clear([cacheNs, secretsId, projectId, dataset])
            preload(() => Promise.resolve(savedSecrets), [cacheNs, secretsId, projectId, dataset])
            setDialogState(false)
          })
          .catch((err) => dispatch({type: 'error', payload: err.message}))
          .finally(() => {
            saving.current = false
          })
      }
    },
    [client, dispatch, handleSaveSecrets, setDialogState, state]
  )
  const handleChangeToken = useCallback(
    (event: React.FormEvent<HTMLInputElement>) => {
      dispatch({
        type: 'change',
        payload: {name: 'token', value: event.currentTarget.value},
      })
    },
    [dispatch]
  )
  const handleChangeSecretKey = useCallback(
    (event: React.FormEvent<HTMLInputElement>) => {
      dispatch({
        type: 'change',
        payload: {name: 'secretKey', value: event.currentTarget.value},
      })
    },
    [dispatch]
  )
  const handleChangeEnableSignedUrls = useCallback(
    (event: React.FormEvent<HTMLInputElement>) => {
      dispatch({
        type: 'change',
        payload: {name: 'enableSignedUrls', value: event.currentTarget.checked},
      })
    },
    [dispatch]
  )
  const handleChangeDrmConfigId = useCallback(
    (event: React.FormEvent<HTMLInputElement>) => {
      dispatch({
        type: 'change',
        payload: {name: 'drmConfigId', value: event.currentTarget.value},
      })
    },
    [dispatch]
  )

  useEffect(() => {
    if (firstField.current) {
      firstField.current.focus()
    }
  }, [firstField])

  return (
    <Dialog
      animate
      id={id}
      onClose={handleClose}
      onClickOutside={handleClose}
      header={<Header />}
      zOffset={DIALOGS_Z_INDEX}
      position="fixed"
      width={1}
    >
      <Box padding={3}>
        <form onSubmit={handleSubmit} noValidate>
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
                    To use Signed URLs, the token must also have System permissions.
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
                value={state.token ?? ''}
                required={!!state.secretKey || state.enableSignedUrls}
              />
            </FormField>
            <FormField title="Secret Key" inputId={secretKeyId}>
              <TextInput
                id={secretKeyId}
                onChange={handleChangeSecretKey}
                type="text"
                value={state.secretKey ?? ''}
                required={!!state.token || state.enableSignedUrls}
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

            <FormField title="DRM Configuration ID" inputId={drmConfigIdId}>
              <TextInput
                id={drmConfigIdId}
                onChange={handleChangeDrmConfigId}
                type="text"
                value={state.drmConfigId ?? ''}
                required={false}
              />
            </FormField>
            <Card padding={[3, 3, 3]} radius={2} shadow={1} tone="neutral">
              <Stack space={3}>
                <Text size={1}>
                  DRM (Digital Rights Management) provides an extra layer of content security for
                  video content streamed from Mux. For additional information check out our{' '}
                  <a
                    href="https://www.mux.com/docs/guides/protect-videos-with-drm#play-drm-protected-videos"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    DRM Guide
                  </a>
                  .
                </Text>
                <Text size={1}>
                  <a
                    href="https://www.mux.com/support/human"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Contact us
                  </a>{' '}
                  to get started using DRM.
                </Text>
              </Stack>
            </Card>

            <Inline space={2}>
              <Button
                text="Save"
                disabled={!dirty}
                loading={state.submitting}
                tone="primary"
                mode="default"
                type="submit"
              />
              <Button
                disabled={state.submitting}
                text="Cancel"
                mode="bleed"
                onClick={handleClose}
              />
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

// Wrapper component that manages its own dialog state (used in VideosBrowser)
export default function ConfigureApi() {
  const [dialogOpen, setDialogOpen] = useDialogState()
  const secretDocumentValues = useSecretsDocumentValues()

  const openDialog = useCallback(() => setDialogOpen('secrets'), [setDialogOpen])

  if (dialogOpen === 'secrets') {
    return (
      <ConfigureApiDialog
        secrets={secretDocumentValues.value.secrets}
        setDialogState={setDialogOpen}
      />
    )
  }

  return <Button mode="bleed" text="Configure plugin" onClick={openDialog} />
}
