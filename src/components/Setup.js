import React, {Component} from 'react'
import PropTypes from 'prop-types'

import {uniqueId} from 'lodash'
import {createSigningKeys, haveValidSigningKeys, saveSecrets, testSecrets} from '../actions/secrets'

import Fieldset from 'part:@sanity/components/fieldsets/default'
import FormField from 'part:@sanity/components/formfields/default'
import TextInput from 'part:@sanity/components/textinputs/default'
import Checkbox from 'part:@sanity/components/toggles/checkbox'

import {Button, Box} from '@sanity/ui'

import styles from './Setup.css'

const propTypes = {
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  secrets: PropTypes.shape({
    token: PropTypes.string,
    secretKey: PropTypes.string,
    enableSignedUrls: PropTypes.bool,
    signingKeyId: PropTypes.string,
    signingKeyPrivate: PropTypes.string,
  }),
}

class MuxVideoInputSetup extends Component {
  tokenInputId = uniqueId('MuxTokenInput')
  secretKeyInputId = uniqueId('MuxSecretInput')
  enableSignedUrlsInputId = uniqueId('MuxEnableSignedUrlsInput')

  state = {
    token: null,
    secretKey: null,
    enableSignedUrls: false,
    isLoading: false,
    error: null,
  }

  static getDerivedStateFromProps(nextProps, nextState) {
    if (!nextState.secrets) {
      return null
    }
    if (nextProps.secrets) {
      return {
        token: nextProps.secrets.token,
        secretKey: nextProps.secrets.secretKey,
        enableSignedUrls: nextProps.secrets.enableSignedUrls,
        signingKeyId: nextProps.secrets.signingKeyId,
        signingKeyPrivate: nextProps.secrets.signingKeyPrivate,
      }
    }
    return null
  }

  constructor(props) {
    super(props)
    if (props.secrets) {
      const {token, secretKey, enableSignedUrls, signingKeyId, signingKeyPrivate} = props.secrets
      this.state.token = token
      this.state.secretKey = secretKey
      this.state.enableSignedUrls = enableSignedUrls
      this.state.signingKeyId = signingKeyId
      this.state.signingKeyPrivate = signingKeyPrivate
    }
    this.firstField = React.createRef()
  }

  componentDidMount() {
    this.firstField.current.focus()
  }

  handleTokenChanged = (event) => {
    this.setState({token: event.currentTarget.value})
  }

  handleSecretKeyChanged = (event) => {
    this.setState({secretKey: event.currentTarget.value})
  }

  handleEnableSignedUrls = (event) => this.setState({enableSignedUrls: event.currentTarget.checked})

  handleCancel = (event) => {
    this.props.onCancel()
  }

  handleOnSubmit = (event) => {
    event.preventDefault()
  }

  handleSaveToken = async () => {
    const handleError = (err) => {
      console.error(err) // eslint-disable-line no-console
      this.setState({
        isLoading: false,
        error: 'Something went wrong saving the token. See console.error for more info.',
      })
    }
    this.setState({isLoading: true})
    const token = this.state.token || null
    const secretKey = this.state.secretKey || null
    const enableSignedUrls = this.state.enableSignedUrls || false
    let signingKeyId = this.state.signingKeyId || null
    let signingKeyPrivate = this.state.signingKeyPrivate || null

    const hasValidSigningKeys = await haveValidSigningKeys(signingKeyId, signingKeyPrivate)

    try {
      await saveSecrets(token, secretKey, enableSignedUrls, signingKeyId, signingKeyPrivate)
    } catch (err) {
      handleError(err)
      return
    }

    if (!hasValidSigningKeys && enableSignedUrls) {
      try {
        const {data} = await createSigningKeys()
        signingKeyId = data.id
        signingKeyPrivate = data.private_key
        await saveSecrets(token, secretKey, enableSignedUrls, signingKeyId, signingKeyPrivate)
      } catch ({message}) {
        this.setState({error: message})
      }
    }

    let result

    try {
      result = await testSecrets()
    } catch (err) {
      handleError(err)
      return
    }

    this.setState({isLoading: false})

    if (result.status) {
      this.props.onSave({token, secretKey, enableSignedUrls, signingKeyId, signingKeyPrivate})
      return
    }

    handleError({error: 'Invalid credentials'})
  }

  render() {
    const {error, isLoading} = this.state
    return (
      <Box padding={3} style={{position: 'relative'}}>
        <form onSubmit={this.handleOnSubmit}>
          <Fieldset
            level={1}
            description="The credentials will be stored safely in a hidden document only available to editors."
            changeIndicator={false}
          >
            <Box paddingRight={3}>
              <FormField
                changeIndicator={false}
                label="Access Token"
                labelFor={this.tokenInputId}
                level={0}
                className={styles.formField}
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
                className={styles.formField}
              >
                <TextInput
                  id={this.secretKeyInputId}
                  onChange={this.handleSecretKeyChanged}
                  type="text"
                  value={this.state.secretKey || ''}
                />
              </FormField>
              <FormField
                changeIndicator={false}
                label="Enable Signed Urls"
                labelFor={this.enableSignedUrlsInputId}
                level={0}
                className={styles.formField}
              >
                <Checkbox
                  id={this.enableSignedUrlsInputId}
                  onChange={this.handleEnableSignedUrls}
                  checked={this.state.enableSignedUrls || false}
                />
                {this.state.signingKeyId ? (
                  <p className={styles.paragraph}>
                    The signing key ID that Sanity will use is{' '}
                    <code>{this.state.signingKeyId}</code>. This key is only used for previewing
                    content in the Sanity UI. You should generate a different key to use in your
                    application server.
                  </p>
                ) : null}
              </FormField>

              <div className={styles.buttons}>
                <Button
                  text="Save"
                  loading={isLoading}
                  tone="primary"
                  mode="default"
                  onClick={this.handleSaveToken}
                />

                <Button text="Cancel" tone="primary" mode="bleed" onClick={this.handleCancel} />
              </div>

              {error && <p className={styles.error}>{error}</p>}
            </Box>
          </Fieldset>
          <div className={styles.notice}>
            <p>
              To set up a new access token, go to your{' '}
              <a
                href="https://dashboard.mux.com/settings/access-tokens"
                target="_blank"
                rel="noreferrer noopener"
              >
                account on mux.com
              </a>
              .
            </p>
            <p>
              The access token needs permissions: <strong>Mux Video </strong>
              (Full Access) and <strong>Mux Data</strong> (Read)
            </p>
          </div>
        </form>
      </Box>
    )
  }
}

MuxVideoInputSetup.propTypes = propTypes

export default MuxVideoInputSetup
