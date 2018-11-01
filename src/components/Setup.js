import React, {Component} from 'react'
import PropTypes from 'prop-types'

import {uniqueId} from 'lodash'
import {saveSecrets} from '../actions/secrets'

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
    this.setState({isLoading: true})
    const token = this.state.token || null
    const secretKey = this.state.secretKey || null
    saveSecrets(token, secretKey)
      .then(() => {
        this.setState({isLoading: false})
        this.props.onSave({token, secretKey})
      })
      .catch(err => {
        console.error(err) // eslint-disable-line no-console
        this.setState({error: err})
      })
  }

  render() {
    const {error, isLoading} = this.state

    return (
      <div className={styles.root}>
        <form onSubmit={this.handleOnSubmit}>
          <Fieldset
            legend={'MUX API Credentials'}
            description="The credentials will be stored safely in a hidden document only available to editors."
            level={1}
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
                type="password"
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
                type="password"
                value={this.state.secretKey || ''}
              />
            </FormField>

            <p>
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
            </p>

            {error && (
              <p>Something went wrong saving the token. See console.error for more info.</p>
            )}
          </Fieldset>
        </form>
      </div>
    )
  }
}

MuxVideoInputSetup.propTypes = propTypes

export default MuxVideoInputSetup
