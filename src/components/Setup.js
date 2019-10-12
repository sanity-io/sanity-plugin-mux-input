import React, {Component} from 'react'
import PropTypes from 'prop-types'

import {uniqueId} from 'lodash'
import {saveSecrets, testSecrets} from '../actions/secrets'

import Button from 'part:@sanity/components/buttons/default'
import Fieldset from 'part:@sanity/components/fieldsets/default'
import FormField from 'part:@sanity/components/formfields/default'
import TextInput from 'part:@sanity/components/textinputs/default'

import styles from './Setup.css'

const propTypes = {
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  secrets: PropTypes.shape({
    token: PropTypes.string,
    secretKey: PropTypes.string
  })
}

class MuxVideoInputSetup extends Component {
  tokenInputId = uniqueId('MuxTokenInput')
  secretKeyInputId = uniqueId('MuxSecretInput')

  state = {
    token: null,
    secretKey: null,
    isLoading: false,
    error: null
  }

  static getDerivedStateFromProps(nextProps, nextState) {
    if (!nextState.secrets) {
      return null
    }
    if (nextProps.secrets) {
      return {
        token: nextProps.secrets.token,
        secretKey: nextProps.secrets.secretKey
      }
    }
    return null
  }

  constructor(props) {
    super(props)
    if (props.secrets) {
      const {token, secretKey} = props.secrets
      this.state.token = token
      this.state.secretKey = secretKey
    }
    this.firstField = React.createRef()
  }

  componentDidMount() {
    this.firstField.current.focus()
  }

  handleTokenChanged = event => {
    this.setState({token: event.currentTarget.value})
  }

  handleSecretKeyChanged = event => {
    this.setState({secretKey: event.currentTarget.value})
  }

  handleCancel = event => {
    this.props.onCancel()
  }

  handleOnSubmit = event => {
    event.preventDefault()
  }

  handleSaveToken = () => {
    const handleError = err => {
      console.error(err) // eslint-disable-line no-console
      this.setState({
        isLoading: false,
        error: 'Something went wrong saving the token. See console.error for more info.'
      })
    }
    this.setState({isLoading: true})
    const token = this.state.token || null
    const secretKey = this.state.secretKey || null
    saveSecrets(token, secretKey)
      .then(() => {
        testSecrets()
          .then(result => {
            this.setState({isLoading: false})
            if (result.status) {
              this.props.onSave({token, secretKey})
              return
            }
            this.setState({error: 'Invalid credentials'})
          })
          .catch(handleError)
      })
      .catch(handleError)
  }

  render() {
    const {error, isLoading} = this.state
    return (
      <div className={styles.root}>
        <form onSubmit={this.handleOnSubmit}>
          <Fieldset
            legend={'MUX API Credentials'}
            level={1}
            description="The credentials will be stored safely in a hidden document only available to editors."
          >
            <FormField
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

            <div className={styles.buttons}>
              <Button
                loading={isLoading}
                color="primary"
                kind="default"
                onClick={this.handleSaveToken}
              >
                Save
              </Button>
              <Button color="primary" kind="simple" onClick={this.handleCancel}>
                Cancel
              </Button>
            </div>

            {error && <p className={styles.error}>{error}</p>}
          </Fieldset>
          <div className={styles.notice}>
            <p>
              To set up a new access token, go to your{' '}
              <a
                href="https://dashboard.mux.com/settings/access-tokens"
                target="_blank"
                rel="noreferer noopener"
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
      </div>
    )
  }
}

MuxVideoInputSetup.propTypes = propTypes

export default MuxVideoInputSetup
