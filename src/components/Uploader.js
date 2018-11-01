import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {fromEvent} from 'rxjs'
import {takeUntil} from 'rxjs/operators'

import {extractDroppedFiles} from '../util/extractFiles'
import uploadSourceAction from '../actions/upload'

import FormField from 'part:@sanity/components/formfields/default'
import FileInputButton from 'part:@sanity/components/fileinput/button'
import DefaultButton from 'part:@sanity/components/buttons/default'
import PopOver from 'part:@sanity/components/dialogs/popover'
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

function uploadSource(source, callback) {
  isValidVideoSource(source, (error, result) => {
    if (error) {
      return callback(error)
    }
    return callback(null, uploadSourceAction(source))
  })
}

const propTypes = {
  hasFocus: PropTypes.bool,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  onCancel: PropTypes.func,
  onUploadComplete: PropTypes.func,
  secrets: PropTypes.shape({token: PropTypes.string, secretKey: PropTypes.string}),
  showCancelButton: PropTypes.bool
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

  cancelUploadButton = React.createRef()

  componentWillUnmount() {
    this.unSubscribeToUpload()
  }

  unSubscribeToUpload() {
    if (this.upload && !this.upload.closed) {
      this.upload.unsubscribe()
    }
  }

  subscribeToUpload = (upload, callback) => {
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
    uploadSource(files[0], (err, subscription) => {
      if (err) {
        this.setState({invalidFile: true, error: err})
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
      this.setState({isComplete: true, uploadState: null, asset})
    }
    if (callback) {
      return callback(null, response)
    }
    return true
  }

  handleUploadError = (error, callback) => {
    if (error) {
      this.setState({uploadError: error})
    }
    if (callback) {
      return callback(error)
    }
    return true
  }

  handlePaste = event => {
    const clipboardData = event.clipboardData || window.clipboardData
    const url = clipboardData.getData('text')
    const cbFn = err => {
      if (err) {
        this.setState({invalidPaste: true, error: err})
      }
      setTimeout(() => {
        this.setState({invalidPaste: false, error: null})
      }, 2000)
    }
    uploadSource(url, (err, subscription) => {
      if (err) {
        return this.handleUploadError(err, cbFn)
      }
      return this.setState({uploadError: null, uploadState: 0}, () => {
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
        this.handleUploadFiles(files[0])
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
    this.setState({uploadState: null})
  }

  handleCloseButtonClicked = event => {
    this.props.onCancel(event)
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
      uploadError: null,
      uploadState: null
    })
  }

  renderUploadError() {
    return (
      <div className={styles.error}>
        <div className={styles.errorMessage}>
          <p>{this.state.uploadError.message}</p>
        </div>
      </div>
    )
  }

  renderUploadPlaceHolder() {
    const {invalidFile, invalidPaste} = this.state
    return (
      <div
        className={styles.uploadPlaceholder}
        tabIndex={0}
        onBlur={this.props.onBlur}
        onFocus={this.props.onFocus}
        onDrop={this.handleDrop}
        onPaste={this.handlePaste}
        onDragOver={this.handleDragOver}
        onDragLeave={this.handleDragLeave}
        onDragEnter={this.handleDragEnter}
      >
        <div>
          <FormField level={0}>
            <UploadPlaceholder
              hasFocus={this.props.hasFocus}
              invalidPaste={invalidPaste}
              invalidFile={invalidFile}
            />
          </FormField>
          <FormField level={0}>
            <FileInputButton icon={UploadIcon} onSelect={this.handleUploadFiles} accept={'video/*'}>
              Select file
            </FileInputButton>

            {this.props.showCancelButton && (
              <DefaultButton color="primary" onClick={this.handleCloseButtonClicked} kind="simple">
                Cancel
              </DefaultButton>
            )}
          </FormField>
        </div>
      </div>
    )
  }

  returnUploadProgress() {
    const {uploadState, isComplete} = this.state
    return (
      <PopOver
        color="default"
        useOverlay={true}
        onEscape={this.handleErrorClose}
        onClickOutside={this.handleErrorClose}
        padding="small"
      >
        <DialogContent size="small" title="Upload failed">
          <div className={styles.progressBar}>
            <ProgressBar
              percent={uploadState}
              text={isComplete ? 'Complete' : 'Uploading'}
              completed={isComplete}
              showPercent
              animation
              color="primary"
            />
          </div>
          <div ref={this.cancelUploadButton}>
            <DefaultButton color="danger" onClick={this.handleCancelUploadButtonClicked}>
              Cancel upload
            </DefaultButton>
          </div>
          {this.state.uploadError && this.renderUploadError()}
        </DialogContent>
      </PopOver>
    )
  }

  render() {
    return (
      <div className={styles.root}>
        {this.state.uploadState !== null && this.returnUploadProgress()}
        {this.renderUploadPlaceHolder()}
      </div>
    )
  }
}

MuxVideoInputUploader.propTypes = propTypes

export default MuxVideoInputUploader
