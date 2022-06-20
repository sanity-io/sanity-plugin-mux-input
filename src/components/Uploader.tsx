import type {SanityClient} from '@sanity/client'
import {UploadIcon} from '@sanity/icons'
import {Box, Button, Card, Dialog, Flex, Grid, Inline, Text} from '@sanity/ui'
import React, {Component} from 'react'
import {FiUpload} from 'react-icons/all'
import {Subject} from 'rxjs'
import {takeUntil, tap} from 'rxjs/operators'
import {LinearProgress} from 'sanity/_unstable'
import {FormField} from 'sanity/form'

import {uploadFile, uploadUrl} from '../actions/upload'
import {extractDroppedFiles} from '../util/extractFiles'
import FileInputButton from './FileInputButton'
import styles from './Uploader.module.css'
import UploadPlaceholder from './UploadPlaceholder'

const ctrlKey = 17
const cmdKey = 91

function createEventHandler() {
  const events$ = new Subject()
  const handler = (event) => events$.next(event)
  return [events$.asObservable(), handler]
}

export interface Props {
  client: SanityClient
  hasFocus?: boolean
  onFocus?: (event: any) => void
  onBlur?: () => void
  onBrowse: () => void
  onSetupButtonClicked: () => void
  onUploadComplete?: (asset: any) => void
  secrets?: {
    token: string
    secretKey: string
    enableSignedUrls: boolean
  }
  buttons?: React.ReactNode
  children?: React.ReactNode
}
export interface State {
  isDraggingOver: boolean
  invalidPaste: boolean
  invalidFile: boolean
  uploadProgress: number
  fileInfo: any
  uuid: any
  error: any
  url: any
}

class MuxVideoInputUploader extends Component<Props, State> {
  static defaultProps = {
    hasFocus: false,
    onFocus: null,
    onBlur: null,
    onUploadComplete: null,
    secrets: {
      token: '',
      secretKey: '',
      enableSignedUrls: false,
    },
    buttons: null,
    children: null,
  }

  state = {
    isDraggingOver: false,
    invalidPaste: false,
    invalidFile: false,
    uploadProgress: null,
    fileInfo: null,
    uuid: null,
    error: null,
    url: null,
  }
  dragEnteredEls = []

  upload = null

  ctrlDown = false

  onCancelUploadButtonClick$: any
  handleCancelUploadButtonClick: any

  cancelUploadButton = React.createRef<any>()
  hiddenTextField = React.createRef<any>()
  container = React.createRef<any>()

  componentWillUnmount() {
    this.unSubscribeToUpload()
  }

  componentDidMount() {
    const [onClick$, onClick] = createEventHandler()
    this.onCancelUploadButtonClick$ = onClick$
    this.handleCancelUploadButtonClick = onClick
  }

  unSubscribeToUpload() {
    if (this.upload && !this.upload.closed) {
      this.upload.unsubscribe()
    }
  }

  handleProgress = (evt) => {
    if (evt.percent) {
      this.setState({uploadProgress: evt.percent})
    }
    if (evt.file) {
      this.setState({fileInfo: evt.file})
    }
  }

  handleUploadFile = (file) => {
    this.setState({uploadProgress: 0, fileInfo: null, uuid: null})
    this.upload = uploadFile(file, {enableSignedUrls: this.props.secrets.enableSignedUrls})
      .pipe(
        takeUntil(
          this.onCancelUploadButtonClick$.pipe(
            tap(() => {
              if (this.state.uuid) {
                this.props.client.delete(this.state.uuid)
              }
            })
          )
        )
      )
      .subscribe({
        complete: () => {
          this.setState({error: null, uploadProgress: null, uuid: null})
        },
        next: (event) => {
          this.handleUploadEvent(event)
        },
        error: (err) => {
          this.setState({error: err, uploadProgress: null, uuid: null})
        },
      })
  }

  handleUploadEvent = (event) => {
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

  handleUploadSuccess = (assetDocument) => {
    this.setState({uploadProgress: 100})
    if (this.props.onUploadComplete) {
      this.props.onUploadComplete(assetDocument)
    }
  }

  handlePaste = (event) => {
    const clipboardData = event.clipboardData || (window as any).clipboardData
    const url = clipboardData.getData('text')
    const options = {enableSignedUrls: this.props.secrets.enableSignedUrls}

    this.upload = uploadUrl(url, options).subscribe({
      complete: () => {
        this.setState({error: null, uploadProgress: null, url: null})
      },
      next: (sEvent) => {
        this.handleUploadEvent(sEvent)
      },
      error: (err) => {
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
      },
    })
  }

  handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    this.setState({isDraggingOver: false})
    event.preventDefault()
    event.stopPropagation()
    extractDroppedFiles(event.nativeEvent.dataTransfer).then((files) => {
      if (files) {
        this.handleUploadFile(files[0])
      }
    })
  }

  handleDragOver = (event) => {
    event.preventDefault()
    event.stopPropagation()
  }

  handleDragEnter = (event) => {
    event.stopPropagation()
    this.dragEnteredEls.push(event.target)
    this.setState({isDraggingOver: true})
  }

  handleDragLeave = (event) => {
    event.stopPropagation()
    const idx = this.dragEnteredEls.indexOf(event.target)
    if (idx > -1) {
      this.dragEnteredEls.splice(idx, 1)
    }
    if (this.dragEnteredEls.length === 0) {
      this.setState({isDraggingOver: false})
    }
  }

  handleCancelUploadButtonClicked = () => {
    this.setState({uploadProgress: null, error: null})
    this.container.current.focus()
  }

  handleErrorClose = (event?: any) => {
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
      uploadProgress: null,
    })
    this.container.current.focus()
  }

  handleSetupButtonClicked = (event) => {
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
        <Flex align="center">
          <Box flex={1} padding={2}>
            <Inline space={2}>
              <FileInputButton
                icon={<FiUpload data-sanity-icon="upload" />}
                onSelect={(files) => this.handleUploadFile(files[0])}
                accept={'video/*'}
                text="Upload"
              />
              <Button mode="ghost" tone="default" text="Browse" onClick={this.props.onBrowse} />
            </Inline>
          </Box>
        </Flex>
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
        : 'Waiting for Mux to complete the file'
    if (this.state.error) {
      text = this.state.error.message
    }
    if (url) {
      text = `Uploading ${url}`
    }
    // console.log({text})
    return (
      <div className={styles.uploadProgress}>
        <div className={styles.progressBar}>
          <LinearProgress
            value={uploadProgress}
            // text={text}
            // isInProgress={uploadProgress === 100 && !this.state.error}
            // showPercent
            // animation
            // color="primary"
          />
        </div>
        {(uploadProgress < 100 || this.state.error) && (
          <div ref={this.cancelUploadButton}>
            <Button
              text="Cancel upload"
              padding={3}
              tone="critical"
              onClick={this.handleCancelUploadButtonClick}
            />
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
          <Button
            text="Run setup"
            tone="primary"
            padding={3}
            onClick={this.handleSetupButtonClicked}
          />
        </div>
      )
    }
    return (
      <Dialog
        id="mux-upload-error"
        title="Upload failed"
        color="danger"
        // useOverlay
        onClose={this.handleErrorClose}
        // onEscape={this.handleErrorClose}
        onClickOutside={this.handleErrorClose}
      >
        <Box padding={4}>
          <Text>{message}</Text>
        </Box>
      </Dialog>
    )
  }

  renderButtons() {
    if (this.state.uploadProgress === null && this.props.buttons) {
      return (
        <Grid columns={4} gap={2}>
          <FileInputButton
            icon={<UploadIcon data-sanity-icon="upload" />}
            onSelect={(files) => this.handleUploadFile(files[0])}
            text="Upload"
          />
          {this.props.buttons}
        </Grid>
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

  handleKeyDown = (event) => {
    if (event.keyCode == ctrlKey || event.keyCode == cmdKey) {
      this.ctrlDown = true
    }
    const vKey = 86
    if (this.ctrlDown && event.keyCode == vKey) {
      this.hiddenTextField.current.focus()
    }
  }

  handleKeyUp = (event) => {
    if (event.keyCode == ctrlKey || event.keyCode == cmdKey) {
      this.ctrlDown = false
    }
  }

  handleFocus = (event) => {
    this.props.onFocus(event)
  }

  render() {
    return (
      <Card
        padding={0}
        radius={0}
        shadow={0}
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
      </Card>
    )
  }
}

export default MuxVideoInputUploader
