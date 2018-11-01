import React, {Component} from 'react'
import Button from 'part:@sanity/components/buttons/default'

import {fetchSecrets} from '../actions/secrets'
import {getAsset, deleteAsset} from '../actions/assets'
import client from 'part:@sanity/base/client'
import DocumentWindow from '@sanity/document-window'

import PatchEvent, {set, unset} from 'part:@sanity/form-builder/patch-event'
import Checkbox from 'part:@sanity/components/toggles/checkbox'
import DefaultButton from 'part:@sanity/components/buttons/default'
import FormField from 'part:@sanity/components/formfields/default'
import PopOver from 'part:@sanity/components/dialogs/popover'
import SetupIcon from 'part:@sanity/base/plugin-icon'
import Spinner from 'part:@sanity/components/loading/spinner'

import Setup from './Setup'
import Video from './Video'
import MuxLogo from './MuxLogo'
import Uploader from './Uploader'
import styles from './Input.css'

const cachedSecrets = {
  token: null,
  secretKey: null
}

function validateSecrets(secrets) {
  return Object.keys(secrets).some(key => secrets[key] === null)
}

function getSecrets() {
  if (cachedSecrets.token) {
    return Promise.resolve({
      isInitialSetup: true,
      needsSetup: false,
      secrets: cachedSecrets
    })
  }
  return fetchSecrets()
    .then(({secrets, exists}) => {
      cachedSecrets.token = secrets.token
      cachedSecrets.secretKey = secrets.secretKey
      return {
        isInitialSetup: !exists,
        needsSetup: validateSecrets(cachedSecrets),
        secrets: cachedSecrets
      }
    })
    .catch(err => {
      console.error(err) // eslint-disable-line no-console
    })
}

export default class MuxVideoInput extends Component {
  state = {
    assetDocument: null,
    confirmRemove: false,
    deleteOnMuxChecked: false,
    hasFocus: false,
    isInitialSetup: true,
    isLoading: 'secrets',
    needsSetup: true,
    secrets: null,
    showNewUpload: false,
    showSetup: false
  }

  constructor(props) {
    super(props)
    getSecrets().then(({secrets, isInitialSetup, needsSetup}) => {
      this.setState({
        secrets,
        isInitialSetup,
        needsSetup,
        isLoading: props.value && props.value.asset // If there is an asset continue loading
      })
    })
    this.setupButton = React.createRef()
    this.pollInterval = null
    this.video = React.createRef()
  }

  componentDidMount() {
    this.setupDocumentWindow()
  }

  focus = () => {
    this.setState({hasFocus: true})
  }

  blur = () => {
    this.setState({hasFocus: false})
  }

  getAssetId() {
    const {value} = this.props
    const {assetDocument} = this.state
    if (assetDocument) {
      return assetDocument._id
    }
    if (value) {
      const {asset} = value
      if (asset && asset._ref) {
        return asset._ref
      }
    }
    return null
  }

  setupDocumentWindow() {
    const id = this.getAssetId()
    if (!id) {
      return
    }
    const query = new DocumentWindow.Query()
      .constraint('_id == $id')
      .params({id})
      .from(0)
      .to(1)
    this.documentWindow = new DocumentWindow({client, query})
    this.documentWindow.on('data', docs => {
      const assetDocument = docs[0] || null
      this.setState({assetDocument})
      if (assetDocument.status === 'preparing') {
        this.pollMux()
      }
      if (assetDocument.status === 'ready') {
        clearInterval(this.pollInterval)
        this.pollInterval = null
      }
      this.setState({assetDocument, isLoading: false})
    })
  }

  pollMux = () => {
    const assetDocument = this.state.assetDocument
    if (!assetDocument) {
      return
    }
    if (this.pollInterval) {
      return
    }
    this.pollInterval = setInterval(() => {
      getAsset(assetDocument.assetId)
        .then(response => {
          const props = response.data
          client
            .patch(assetDocument._id)
            .set({status: props.status})
            .commit({returnDocuments: false})
        })
        .catch(err => {
          console.error(err) // eslint-disable-line no-console
        })
    }, 2000)
  }

  handleSetupButtonClicked = event => {
    this.setState({showSetup: true})
  }

  handleSaveSetup = ({token, secretKey}) => {
    cachedSecrets.token = token
    cachedSecrets.secretKey = secretKey
    this.setState({
      showSetup: false,
      secrets: cachedSecrets,
      needsSetup: validateSecrets(cachedSecrets)
    })
  }

  handleCancelSaveSetup = () => {
    this.setState({showSetup: false})
  }

  handleOnUploadComplete = result => {
    const {onChange} = this.props
    const {id} = result
    onChange(PatchEvent.from(set({_ref: id}, ['asset'])))
    this.setState({showNewUpload: false, assetDocument: result.document}, () => {
      this.setupDocumentWindow()
    })
  }

  handleNewUploadButton = event => {
    this.setState({showNewUpload: true})
  }

  handleCancelNewUpload = event => {
    this.setState({showNewUpload: false})
  }

  handleRemoveVideoButtonClicked = event => {
    event.preventDefault()
    event.stopPropagation()
    this.setState({confirmRemove: true})
  }

  handleRemoveVideo = event => {
    const {onChange} = this.props
    this.setState({isLoading: true})
    const unsetAsset = () => {
      onChange(PatchEvent.from(unset(['asset'])))
      this.setState({
        assetDocument: null,
        confirmRemove: false,
        deleteOnMuxChecked: false,
        isLoading: false
      })
    }
    if (this.state.deleteOnMuxChecked) {
      const {assetDocument} = this.state
      return deleteAsset(assetDocument.assetId)
        .then(response => {
          unsetAsset()
        })
        .catch(err => {
          console.error(err) // eslint-disable-line no-console
        })
    }
    return unsetAsset()
  }

  handleCancelRemove = event => {
    this.setState({confirmRemove: false, deleteOnMuxChecked: false})
  }

  handleDeleteOnMuxCheckBoxClicked = event => {
    this.setState(prevState => ({
      deleteOnMuxChecked: !prevState.deleteOnMuxChecked
    }))
  }

  renderSetup() {
    const {secrets} = this.state
    const setup = (
      <Setup
        secrets={secrets ? secrets : null}
        onSave={this.handleSaveSetup}
        onCancel={this.handleCancelSaveSetup}
      />
    )

    return (
      <PopOver
        color="default"
        useOverlay={true}
        onEscape={this.handleCancelSaveSetup}
        onClickOutside={this.handleCancelSaveSetup}
        padding="large"
      >
        {setup}
      </PopOver>
    )
  }

  renderSetupButton() {
    const {isLoading, showSetup, needsSetup} = this.state
    const renderSetup = !isLoading && showSetup
    return (
      <div className={styles.setupButtonContainer}>
        <Button
          color={needsSetup ? 'danger' : 'primary'}
          onClick={this.handleSetupButtonClicked}
          icon={SetupIcon}
          kind="simple"
          title="Configure MUX API access"
          tabIndex={1}
        />
        {renderSetup && this.renderSetup()}
      </div>
    )
  }

  renderSetupNotice() {
    const {isLoading, needsSetup, isInitialSetup} = this.state
    const renderSetupNotice = needsSetup
    if (isLoading || !renderSetupNotice) {
      return null
    }
    return (
      <div className={styles.warning}>
        <MuxLogo />
        {isInitialSetup && (
          <p>
            Looks like this is the first time you are using the MUX video plugin in this dataset.
            Great!
          </p>
        )}
        <p>Before you can upload video, you must set your MUX credentials.</p>
        <p>Click the plugin button in the field title to open Setup.</p>
      </div>
    )
  }

  renderAsset() {
    const {isLoading, needsSetup, showNewUpload, assetDocument, confirmRemove} = this.state
    const renderAsset = assetDocument !== null
    const renderUploader = (!isLoading && !needsSetup && !renderAsset) || showNewUpload
    if (!renderAsset) {
      return null
    }
    return (
      <div className={styles.videoContainer}>
        <Video assetDocument={assetDocument} />
        {!renderUploader && (
          <div className={styles.videoButtons}>
            <DefaultButton onClick={this.handleNewUploadButton}>Upload</DefaultButton>

            <div className={styles.cancelRemoveVideoButton}>
              <DefaultButton onClick={this.handleRemoveVideoButtonClicked}>Remove</DefaultButton>
              {confirmRemove && (
                <PopOver
                  color="default"
                  useOverlay={true}
                  onEscape={this.handleCancelRemove}
                  onClickOutside={this.handleCancelRemove}
                  padding="large"
                >
                  <div className={styles.confirmDeletePopover}>
                    <div className={styles.confirmDeletePopoverButtons}>
                      <DefaultButton onClick={this.handleCancelRemove}>Cancel</DefaultButton>
                      <DefaultButton
                        color="danger"
                        onClick={this.handleRemoveVideo}
                        loading={this.state.isLoading}
                      >
                        Remove
                      </DefaultButton>
                    </div>
                    <div>
                      <Checkbox
                        checked={this.state.deleteOnMuxChecked}
                        onChange={this.handleDeleteOnMuxCheckBoxClicked}
                      >
                        Delete asset on MUX.com
                      </Checkbox>
                    </div>
                  </div>
                </PopOver>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  render() {
    const {type, level, markers} = this.props
    const {isLoading, needsSetup, secrets, hasFocus, showNewUpload, assetDocument} = this.state
    const renderUploader =
      (!isLoading && !needsSetup && !assetDocument) || (assetDocument && showNewUpload)
    return (
      <div className={styles.root}>
        <div className={styles.header}>
          <FormField
            label={type.title}
            markers={markers}
            description={type.description}
            level={level}
            className={styles.formField}
          />
          {this.renderSetupButton()}
        </div>

        {isLoading === 'secrets' && (
          <div className={styles.isLoading}>
            <Spinner inline />
            <span>Fetching credentials</span>
          </div>
        )}

        {this.renderSetupNotice()}

        {<div className={showNewUpload ? styles.hidden : ''}>{this.renderAsset()}</div>}

        {renderUploader && (
          <div>
            <Uploader
              showCancelButton={showNewUpload}
              onUploadComplete={this.handleOnUploadComplete}
              secrets={secrets}
              onBlur={this.blur}
              onFocus={this.focus}
              hasFocus={hasFocus}
              onCancel={this.handleCancelNewUpload}
              label={showNewUpload ? 'Upload a new file' : null}
            />
          </div>
        )}
      </div>
    )
  }
}
