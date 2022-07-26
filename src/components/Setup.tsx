import {Box, Button, Card, Checkbox, Code, Flex, Inline, Stack, Text, TextInput} from '@sanity/ui'
import {uniqueId} from 'lodash'
import FormField from 'part:@sanity/components/formfields/default'
import React, {Component} from 'react'

import {createSigningKeys, haveValidSigningKeys, saveSecrets} from '../actions/secrets'
import type {Secrets} from '../util/types'

interface Props {
  onSave: (secrets: Secrets) => void
  onCancel: () => void
  secrets: Secrets
}
interface State extends Secrets {
  isLoading: boolean
  error: string | null
}
class MuxVideoInputSetup extends Component<Props, State> {
  tokenInputId = uniqueId('MuxTokenInput')
  secretKeyInputId = uniqueId('MuxSecretInput')
  enableSignedUrlsInputId = uniqueId('MuxEnableSignedUrlsInput')

  state: State = {
    token: this.props.secrets?.token,
    secretKey: this.props.secrets?.secretKey,
    enableSignedUrls: this.props.secrets?.enableSignedUrls,
    signingKeyId: this.props.secrets?.signingKeyId,
    signingKeyPrivate: this.props.secrets?.signingKeyPrivate,
    isLoading: false,
    error: null,
  }

  firstField = React.createRef<HTMLInputElement>()

  componentDidMount() {
    this.firstField.current!.focus()
  }

  handleTokenChanged: React.FormEventHandler<HTMLInputElement> = (event) => {
    this.setState({token: event.currentTarget.value})
  }

  handleSecretKeyChanged: React.FormEventHandler<HTMLInputElement> = (event) => {
    this.setState({secretKey: event.currentTarget.value})
  }

  handleEnableSignedUrls: React.FormEventHandler<HTMLInputElement> = (event) =>
    this.setState({enableSignedUrls: event.currentTarget.checked})

  handleOnSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()
  }

  handleSaveToken = async () => {
    this.setState({isLoading: true})

    const {token, secretKey, enableSignedUrls} = this.state
    let {signingKeyId, signingKeyPrivate} = this.state

    try {
      await saveSecrets(token!, secretKey!, enableSignedUrls, signingKeyId!, signingKeyPrivate!)
    } catch (err) {
      console.error('Error while trying to save secrets:', err) // eslint-disable-line no-console
      this.setState({
        isLoading: false,
        error: 'Something went wrong saving the token. See console.error for more info.',
      })
      return
    }

    if (enableSignedUrls) {
      const hasValidSigningKeys = await haveValidSigningKeys(signingKeyId!, signingKeyPrivate!)

      if (!hasValidSigningKeys) {
        try {
          const {data} = await createSigningKeys()
          signingKeyId = data.id
          signingKeyPrivate = data.private_key
          await saveSecrets(token!, secretKey!, enableSignedUrls, signingKeyId, signingKeyPrivate)
        } catch (err: any) {
          // eslint-disable-next-line no-console
          console.log('Error while creating and saving signing key:', err?.message)
          this.setState({error: err?.message!})
        }
      }
    }

    this.setState({isLoading: false})

    this.props.onSave({token, secretKey, enableSignedUrls, signingKeyId, signingKeyPrivate})
  }

  render() {
    const {error, isLoading} = this.state

    return (
      <Box
        paddingRight={4}
        paddingLeft={4}
        paddingBottom={4}
        paddingTop={4}
        style={{position: 'relative'}}
      >
        <form onSubmit={this.handleOnSubmit}>
          <Stack space={4}>
            {!this.state.token && (
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
            <FormField
              changeIndicator={false}
              label="Access Token"
              labelFor={this.tokenInputId}
              level={0}
            >
              <TextInput
                id={this.tokenInputId}
                ref={this.firstField}
                onChange={this.handleTokenChanged}
                type="text"
                value={this.state.token || ''}
              />
            </FormField>
            <FormField
              changeIndicator={false}
              label="Secret Key"
              labelFor={this.secretKeyInputId}
              level={0}
            >
              <TextInput
                id={this.secretKeyInputId}
                onChange={this.handleSecretKeyChanged}
                type="text"
                value={this.state.secretKey || ''}
              />
            </FormField>

            <Stack space={4}>
              <Flex align="center">
                <Checkbox
                  id={this.enableSignedUrlsInputId}
                  onChange={this.handleEnableSignedUrls}
                  checked={this.state.enableSignedUrls || false}
                  style={{display: 'block'}}
                />
                <Box flex={1} paddingLeft={3}>
                  <Text>
                    <label htmlFor={this.enableSignedUrlsInputId}>Enable Signed Urls</label>
                  </Text>
                </Box>
              </Flex>
              {this.state.signingKeyId && this.state.enableSignedUrls ? (
                <Card padding={[3, 3, 3]} radius={2} shadow={1} tone="caution">
                  <Stack space={3}>
                    <Text size={1}>The signing key ID that Sanity will use is:</Text>
                    <Code size={1}>{this.state.signingKeyId}</Code>
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
                loading={isLoading}
                tone="primary"
                mode="default"
                onClick={this.handleSaveToken}
              />

              <Button text="Cancel" tone="primary" mode="bleed" onClick={this.props.onCancel} />
            </Inline>
            {error && (
              <Card padding={[3, 3, 3]} radius={2} shadow={1} tone="critical">
                <Text>{error}</Text>
              </Card>
            )}
          </Stack>
        </form>
      </Box>
    )
  }
}

export default MuxVideoInputSetup
