import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {Subject} from 'rxjs'
import {takeUntil, tap} from 'rxjs/operators'

import {extractDroppedFiles} from '../util/extractFiles'
import {uploadFile, uploadUrl} from '../actions/upload'

import client from 'part:@sanity/base/client'
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

const ctrlKey = 17
const cmdKey = 91

const propTypes = {
  hasFocus: PropTypes.bool,
  onFocus: PropTypes.func,
  onBlur: PropTypes.func,
  onBrowse: PropTypes.func.isRequired,
  onSetupButtonClicked: PropTypes.func.isRequired,
  onUploadComplete: PropTypes.func,
  secrets: PropTypes.shape({token: PropTypes.string, secretKey: PropTypes.string}),
  buttons: PropTypes.node,
  children: PropTypes.node
}

function createEventHandler() {
  const events$ = new Subject()
  const handler = event => events$.next(event)
  return [events$.asObservable(), handler]
}

class MuxVideoInputUploader extends Component {
  state = {
    isDraggingOver: false,
    invalidPaste: false,
    invalidFile: false,
    uploadProgress: null,
    fileInfo: null,
    uuid: null
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

  componentDidMount() {
    const [onClick$, onClick] = createEventHandler()
    this.onCancelUploadButtonClick$ = onClick$
    this.onCancelUploadButtonClick = onClick
  }

  unSubscribeToUpload() {
    if (this.upload && !this.upload.closed) {
      this.upload.unsubscribe()
    }
  }

  handleProgress = evt => {
    if (evt.percent) {
      this.setState({uploadProgress: evt.percent})
    }
    if (evt.file) {
      this.setState({fileInfo: evt.file})
    }
  }

  handleUploadFile = file => {
    this.setState({uploadProgress: 0, fileInfo: null, uuid: null})
    this.upload = uploadFile(file)
      .pipe(
        takeUntil(
          this.onCancelUploadButtonClick$.pipe(
            tap(() => {
              if (this.state.uuid) {
                client.delete(this.state.uuid)
              }
            })
          )
        )
      )
      .subscribe({
        complete: () => {
          this.setState({error: null, uploadProgress: null, uuid: null})
        },
        next: event => {
          this.handleUploadEvent(event)
        },
        error: err => {
          this.setState({error: err, uploadProgress: null, uuid: null})
        }
      })
  }

  handleUploadEvent = event => {
    switch (event.type) {
      case 'success':
        return this.handleUploadSuccess(event.asset)
      case 'progress':
        return this.handleProgress(event)
      case 'file':
        return this.setState({fileInfo: event.file})
      case 'uuid':
        // Means we created a mux.videoAsset document with an uuid
        return this.setState({uuid: event.uuid})
      case 'url':
        return this.setState({url: event.url, uploadProgress: 100})
      default:
        return null
    }
  }

  handleUploadSuccess = assetDocument => {
    this.setState({uploadProgress: 100})
    if (this.props.onUploadComplete) {
      this.props.onUploadComplete(assetDocument)
    }
  }

  handlePaste = event => {
    const clipboardData = event.clipboardData || window.clipboardData
    const url = clipboardData.getData('text')
    this.upload = uploadUrl(url, url.split('/').slice(-1)[0]).subscribe({
      complete: () => {
        this.setState({error: null, uploadProgress: null, url: null})
      },
      next: sEvent => {
        this.handleUploadEvent(sEvent)
      },
      error: err => {
        let error
        // Don't output error dialog when just invalid url
        if (!err.message.toLowerCase().match('invalid url')) {
          error = err
        }
        this.setState({invalidPaste: true, error}, () => {
          setTimeout(() => {
            this.setState({invalidPaste: false, uploadProgress: null})
          }, 2000)
        })
      }
    })
  }

  handleDrop = event => {
    this.setState({isDraggingOver: false})
    event.preventDefault()
    event.stopPropagation()
    extractDroppedFiles(event.nativeEvent.dataTransfer).then(files => {
      if (files) {
        this.handleUploadFile(files[0])
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
    this.setState({isDraggingOver: true, hasFocus: true})
  }

  handleDragLeave = event => {
    event.stopPropagation()
    const idx = this.dragEnteredEls.indexOf(event.target)
    if (idx > -1) {
      this.dragEnteredEls.splice(idx, 1)
    }
    if (this.dragEnteredEls.length === 0) {
      this.setState({isDraggingOver: false, hasFocus: false})
    }
  }

  handleCancelUploadButtonClicked = event => {
    this.setState({uploadProgress: null, error: null})
    this.container.current.focus()
  }

  handleErrorClose = event => {
    if (event) {
      event.preventDefault()
    }
    if (this.state.uploadProgress !== null) {
      return
    }
    this.setState({
      invalidFile: false,
      invalidPaste: false,
      error: null,
      uploadProgress: null
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
    if (this.state.uploadProgress !== null) {
      return null
    }
    const {invalidFile, invalidPaste, isDraggingOver} = this.state
    return (
      <div>
        <FormField level={0}>
          <UploadPlaceholder
            isDraggingOver={isDraggingOver}
            hasFocus={this.props.hasFocus}
            invalidPaste={invalidPaste}
            invalidFile={invalidFile}
          />
        </FormField>
        <ButtonCollection>
          <FileInputButton
            inverted
            icon={UploadIcon}
            onSelect={files => this.handleUploadFile(files[0])}
            accept={'video/*'}
          >
            Select file
          </FileInputButton>
          <DefaultButton inverted onClick={this.props.onBrowse}>
            Browse
          </DefaultButton>
        </ButtonCollection>
      </div>
    )
  }

  // eslint-disable-next-line complexity
  renderUploadProgress() {
    const {uploadProgress, fileInfo, url} = this.state
    if (uploadProgress === null) {
      return null
    }
    let text =
      uploadProgress < 100
        ? `Uploading ${fileInfo ? `'${fileInfo.name}'` : 'file'}`
        : 'Waiting for MUX to complete the file'
    if (this.state.error) {
      text = this.state.error.message
    }
    if (url) {
      text = `Uploading ${url}`
    }
    return (
      <div className={styles.uploadProgress}>
        <div className={styles.progressBar}>
          <ProgressBar
            percent={uploadProgress}
            text={text}
            isInProgress={uploadProgress === 100 && !this.state.error}
            showPercent
            animation
            color="primary"
          />
        </div>
        {(uploadProgress < 100 || this.state.error) && (
          <div ref={this.cancelUploadButton}>
            <DefaultButton color="danger" onClick={this.onCancelUploadButtonClick}>
              Cancel upload
            </DefaultButton>
          </div>
        )}
      </div>
    )
  }

  renderError() {
    const {uploadProgress, error} = this.state
    if (!error) {
      return null
    }
    if (uploadProgress !== null) {
      return null
    }
    let message = this.state.error.message
    if (message === 'Invalid credentials') {
      message = (
        <div>
          <h3>Invalid credentials</h3>
          <p>You need to check your Mux access token and secret key.</p>
          <DefaultButton color="primary" onClick={this.handleSetupButtonClicked} kind="simple">
            Run setup
          </DefaultButton>
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
    if (this.state.uploadProgress === null && this.props.buttons) {
      return (
        <ButtonCollection>
          <FileInputButton
            inverted
            icon={UploadIcon}
            onSelect={files => this.handleUploadFile(files[0])}
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
    if (this.state.uploadProgress !== null) {
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
