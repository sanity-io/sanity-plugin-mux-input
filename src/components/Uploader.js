import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {fromEvent} from 'rxjs'
import {takeUntil} from 'rxjs/operators'

import {extractDroppedFiles} from '../util/extractFiles'
import uploadSourceAction from '../actions/upload'
import {testSecrets} from '../actions/secrets'

import FormField from 'part:@sanity/components/formfields/default'
import FileInputButton from 'part:@sanity/components/fileinput/button'
import ButtonCollection from 'part:@sanity/components/buttons/button-collection'
import DefaultButton from 'part:@sanity/components/buttons/default'
import Dialog from 'part:@sanity/components/dialogs/default'
import DialogContent from 'part:@sanity/components/dialogs/content'
import ProgressBar from 'part:@sanity/components/progress/bar'
import UploadPlaceholder from './UploadPlaceholder'
import UploadIcon from 'part:@sanity/base/upload-icon'

import styles from './Uploader.css'
import {isString} from 'lodash'

// eslint-disable-next-line complexity
function isValidVideoSource(source, callback) {
  // Handle file input
  if (typeof window !== 'undefined' && source instanceof window.File) {
    const fileOptions = optionsFromFile({}, source)
    return callback(null, fileOptions)
  }
  // Test string for url validity
  if (isString(source)) {
    let test
    let msg
    try {
      test = new URL(source)
    } catch (err) {
      msg = 'Not a valid URL'
      test = false
    }
    if (test && !test.protocol.match(/http:|https:/)) {
      msg = 'Not a valid URL'
      test = false
    }
    if (test && test.host.match(/^localhost/g)) {
      msg = `Invalid host ('${test.host}')`
      test = false
    }
    if (!test) {
      return callback(new Error(msg))
    }
    return callback(null, source)
  }
  return callback(new Error('Could not identify source'), null)
}

function optionsFromFile(opts, file) {
  if (typeof window === 'undefined' || !(file instanceof window.File)) {
    return opts
  }
  const fileOpts = {
    filename: opts.preserveFilename === false ? undefined : file.name,
    contentType: file.type
  }

  return {
    ...{
      filename: opts.preserveFilename === false ? undefined : file.name,
      contentType: file.type
    },
    fileOpts
  }
}

const ctrlKey = 17
const cmdKey = 91

const propTypes = {
  hasFocus: PropTypes.bool,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  onSetupButtonClicked: PropTypes.func.isRequired,
  onUploadComplete: PropTypes.func,
  secrets: PropTypes.shape({token: PropTypes.string, secretKey: PropTypes.string}),
  buttons: PropTypes.node,
  children: PropTypes.node
}

class MuxVideoInputUploader extends Component {
  state = {
    isDraggingOver: false,
    invalidPaste: false,
    invalidFile: false,
    isComplete: false,
    uploadState: null
  }
  dragEnteredEls = []

  upload = null

  ctrlDown = false

  cancelUploadButton = React.createRef()
  hiddenTextField = React.createRef()
  container = React.createRef()

  componentWillUnmount() {
    this.unSubscribeToUpload()
  }

  unSubscribeToUpload() {
    if (this.upload && !this.upload.closed) {
      this.upload.unsubscribe()
    }
  }

  uploadSource(source, callback) {
    isValidVideoSource(source, (error, result) => {
      if (error) {
        return callback(error)
      }
      this.setState({uploadState: 0})
      return testSecrets()
        .then(testResult => {
          if (testResult.status) {
            return callback(null, uploadSourceAction(source))
          }
          return callback(new Error('Invalid credentials'), null)
        })
        .catch(err => {
          return callback(err, null)
        })
    })
  }

  subscribeToUpload = (upload, callback) => {
    this.setState({
      invalidFile: false,
      invalidPaste: false,
      error: null
    })
    this.unSubscribeToUpload()
    this.upload = upload.pipe(takeUntil(this.$cancel)).subscribe({
      next: event => {
        this.handleUploadEvent(event, callback)
      },
      error: err => this.handleUploadError(err, callback)
    })
  }

  trackProgress = evt => {
    this.setState({uploadState: evt.percent})
  }

  handleUploadFiles = files => {
    this.setState({uploadState: 0})
    this.uploadSource(files[0], (err, subscription) => {
      if (err) {
        this.setState({invalidFile: true, error: err, uploadState: null})
        return null
      }
      return this.setState({uploadState: 0}, () => {
        this.$cancel = fromEvent(this.cancelUploadButton.current, 'click')
        this.subscribeToUpload(subscription)
      })
    })
  }

  handleUploadResponse = (response, callback) => {
    if (response.statusCode !== 200) {
      const msg = (response.body && response.body.message) || response.statusCode
      return this.handleUploadError(new Error(msg), callback)
    }
    return this.handleUploadSuccess(response, callback)
  }

  handleUploadEvent = (event, callback) => {
    switch (event.type) {
      case 'response':
        return this.handleUploadResponse(event, callback)
      case 'progress':
        return this.trackProgress(event)
      default:
        return null
    }
  }

  handleUploadSuccess = (response, callback) => {
    const asset = response.body.results[0]
    this.props.onUploadComplete(asset)
    if (this.upload && !this.upload.closed) {
      this.setState({isComplete: false, uploadState: null, asset})
    }
    if (callback) {
      return callback(null, response)
    }
    return true
  }

  handleUploadError = (error, callback) => {
    if (error) {
      this.setState({error: error, isComplete: true})
    }
    if (callback) {
      return callback(error)
    }
    return true
  }

  handlePaste = event => {
    if (this.state.uploadState) {
      return
    }
    const clipboardData = event.clipboardData || window.clipboardData
    const url = clipboardData.getData('text')
    const cbFn = err => {
      if (err) {
        this.setState({invalidPaste: true, error: err})
      }
      setTimeout(() => {
        this.setState({invalidPaste: false})
      }, 2000)
    }
    this.uploadSource(url, (err, subscription) => {
      if (err) {
        return this.handleUploadError(err, cbFn)
      }
      return this.setState({error: null, uploadState: 0}, () => {
        this.$cancel = fromEvent(this.cancelUploadButton.current, 'click')
        this.subscribeToUpload(subscription, cbFn)
      })
    })
  }

  handleDrop = event => {
    this.setState({isDraggingOver: false})
    event.preventDefault()
    event.stopPropagation()
    extractDroppedFiles(event.nativeEvent.dataTransfer).then(files => {
      if (files) {
        this.handleUploadFiles(files)
      }
    })
  }

  handleDragOver = event => {
    event.preventDefault()
    event.stopPropagation()
  }

  handleDragEnter = event => {
    event.stopPropagation()
    this.dragEnteredEls.push(event.target)
    this.setState({isDraggingOver: true})
  }

  handleDragLeave = event => {
    event.stopPropagation()
    const idx = this.dragEnteredEls.indexOf(event.target)
    if (idx > -1) {
      this.dragEnteredEls.splice(idx, 1)
    }
    if (this.dragEnteredEls.length === 0) {
      this.setState({isDraggingOver: false})
    }
  }

  handleCancelUploadButtonClicked = event => {
    this.setState({uploadState: null, error: null})
    this.container.current.focus()
  }

  handleErrorClose = event => {
    if (event) {
      event.preventDefault()
    }
    if (this.state.uploadState !== null) {
      return
    }
    this.setState({
      invalidFile: false,
      invalidPaste: false,
      error: null,
      uploadState: null
    })
    this.container.current.focus()
  }

  handleSetupButtonClicked = event => {
    this.handleErrorClose(event)
    this.props.onSetupButtonClicked()
  }

  renderUploadPlaceHolder() {
    if (this.props.children) {
      return null
    }
    if (this.state.uploadState !== null) {
      return null
    }
    const {invalidFile, invalidPaste} = this.state
    return (
      <div>
        <FormField level={0}>
          <UploadPlaceholder invalidPaste={invalidPaste} invalidFile={invalidFile} />
        </FormField>
        <div className={styles.fileInputButtonContainer}>
          <FileInputButton icon={UploadIcon} onSelect={this.handleUploadFiles} accept={'video/*'}>
            Select file
          </FileInputButton>
        </div>
      </div>
    )
  }

  renderUploadProgress() {
    const {uploadState} = this.state
    if (uploadState === null) {
      return null
    }
    let text = uploadState < 100 ? 'Uploading' : 'Waiting for MUX to complete the file'
    if (this.state.error) {
      text = this.state.error.message
    }
    return (
      <div className={styles.uploadProgress}>
        <div className={styles.progressBar}>
          <ProgressBar
            percent={uploadState}
            text={text}
            isInProgress={uploadState === 100 && !this.state.error}
            showPercent
            animation
            color="primary"
          />
        </div>
        {(uploadState < 100 || this.state.error) && (
          <div ref={this.cancelUploadButton}>
            <DefaultButton color="danger" onClick={this.handleCancelUploadButtonClicked}>
              Cancel upload
            </DefaultButton>
          </div>
        )}
      </div>
    )
  }

  renderError() {
    const {uploadState, error} = this.state
    if (!error) {
      return null
    }
    if (uploadState !== null) {
      return null
    }
    let message = this.state.error.message
    if (message === 'Invalid credentials') {
      message = (
        <div>
          <h3>Invalid credentials</h3>
          <p>
            You need to check your Mux access token and secret key.
            <DefaultButton color="primary" onClick={this.handleSetupButtonClicked} kind="simple">
              Run setup
            </DefaultButton>
          </p>
        </div>
      )
    }
    return (
      <Dialog
        title="Upload failed"
        color="danger"
        useOverlay={true}
        onClose={this.handleErrorClose}
        onEscape={this.handleErrorClose}
        onClickOutside={this.handleErrorClose}
      >
        <DialogContent size="small">{message}</DialogContent>
      </Dialog>
    )
  }

  renderButtons() {
    if (this.state.uploadState === null && this.props.buttons) {
      return (
        <ButtonCollection>
          <FileInputButton
            inverted
            icon={UploadIcon}
            onSelect={this.handleUploadFiles}
            accept={'video/*'}
          >
            Upload
          </FileInputButton>
          {this.props.buttons}
        </ButtonCollection>
      )
    }
    return null
  }

  renderChildren() {
    if (this.state.uploadState !== null) {
      return null
    }
    return this.props.children
  }

  handleKeyDown = event => {
    if (event.keyCode == ctrlKey || event.keyCode == cmdKey) {
      this.ctrlDown = true
    }
    const vKey = 86
    if (this.ctrlDown && event.keyCode == vKey) {
      this.hiddenTextField.current.focus()
    }
  }

  handleKeyUp = event => {
    if (event.keyCode == ctrlKey || event.keyCode == cmdKey) {
      this.ctrlDown = false
    }
  }

  handleFocus = event => {
    this.props.onFocus(event)
  }

  render() {
    return (
      <div
        className={styles.root}
        tabIndex={0}
        onBlur={this.props.onBlur}
        onFocus={this.props.onFocus}
        onDrop={this.handleDrop}
        onPaste={this.handlePaste}
        onKeyDown={this.handleKeyDown}
        onDragOver={this.handleDragOver}
        onDragLeave={this.handleDragLeave}
        onDragEnter={this.handleDragEnter}
        ref={this.container}
      >
        <input
          ref={this.hiddenTextField}
          className={styles.hiddenTextField}
          type="text"
          onPaste={this.handlePaste}
        />
        {this.renderError()}
        {this.renderUploadProgress()}
        {this.renderUploadPlaceHolder()}
        {this.renderChildren()}
        {this.renderButtons()}
      </div>
    )
  }
}

MuxVideoInputUploader.propTypes = propTypes

export default MuxVideoInputUploader
