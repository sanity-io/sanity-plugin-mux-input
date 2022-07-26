import type {SanityClient} from '@sanity/client'
import {Card, Stack, Text} from '@sanity/ui'
import React, {Component} from 'react'
import {type Observable, Subject} from 'rxjs'
import {takeUntil, tap} from 'rxjs/operators'

import {uploadFile, uploadUrl} from '../actions/upload'
import {extractDroppedFiles} from '../util/extractFiles'
import type {Secrets, VideoAssetDocument} from '../util/types'
import Player from './Player'
import {ErrorDialog, UploadCard, UploadPlaceholder, UploadProgress} from './Uploader.styles'

interface Props {
  hasFocus: boolean
  onFocus: React.FocusEventHandler<HTMLDivElement>
  onBlur: React.FocusEventHandler<HTMLDivElement>
  onBrowse: () => void
  onRemove: () => void
  onSetupButtonClicked: () => void
  onUploadComplete: (asset: VideoAssetDocument) => void
  secrets: Secrets
  asset: VideoAssetDocument
  readOnly: boolean
  videoReadyToPlay: boolean
  handleVideoReadyToPlay: () => void
  handleRemoveVideo: () => void
}

interface State {
  isDraggingOver: boolean
  invalidPaste: boolean
  invalidFile: boolean
  fileInfo: {name?: string; type?: string} | null
  uuid: null
  uploadProgress: number | null
  error: Error | null
  url: string | null
}

class MuxVideoInputUploader extends Component<Props, State> {
  state: State = {
    isDraggingOver: false,
    invalidPaste: false,
    invalidFile: false,
    uploadProgress: null,
    fileInfo: null,
    uuid: null,
    error: null,
    url: null,
  }
  dragEnteredEls: EventTarget[] = []

  ctrlDown = false

  // eslint-disable-next-line no-warning-comments
  // @TODO add proper typings for the return values of uploadFile and uploadUrl
  upload: any | null = null

  container = React.createRef<HTMLDivElement>()

  onCancelUploadButtonClick$: Observable<unknown> | undefined
  handleCancelUploadButtonClick: React.MouseEventHandler<HTMLButtonElement> | undefined

  componentWillUnmount() {
    this.unSubscribeToUpload()
  }

  componentDidMount() {
    const events$ = new Subject()
    this.onCancelUploadButtonClick$ = events$.asObservable()
    this.handleCancelUploadButtonClick = (event) => events$.next(event)
  }

  unSubscribeToUpload() {
    if (this.upload && !this.upload.closed) {
      this.upload.unsubscribe()
    }
  }

  handleProgress = (evt: {percent: number}) => {
    this.setState({uploadProgress: evt.percent})
  }

  onUpload = (files: FileList) => {
    this.setState({uploadProgress: 0, fileInfo: null, uuid: null})
    this.upload = uploadFile(files[0], {enableSignedUrls: this.props.secrets.enableSignedUrls})
      .pipe(
        takeUntil(
          this.onCancelUploadButtonClick$!.pipe(
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
        next: (event) => {
          this.handleUploadEvent(event)
        },
        error: (err) => {
          this.setState({error: err, uploadProgress: null, uuid: null})
        },
      })
  }

  // eslint-disable-next-line no-warning-comments
  // @TODO add proper typings for the Observable events
  handleUploadEvent = (event: any) => {
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

  handleUploadSuccess = (asset: VideoAssetDocument) => {
    this.setState({uploadProgress: 100})
    this.props.onUploadComplete(asset)
  }

  handlePaste: React.ClipboardEventHandler<HTMLInputElement> = (event) => {
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

  handleDrop: React.DragEventHandler<HTMLDivElement> = (event) => {
    this.setState({isDraggingOver: false})
    event.preventDefault()
    event.stopPropagation()
    extractDroppedFiles(event.nativeEvent.dataTransfer!).then((files) => {
      if (files) {
        // eslint-disable-next-line no-warning-comments
        // @TODO fix the typing on files
        this.onUpload(files as any)
      }
    })
  }

  handleDragOver: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault()
    event.stopPropagation()
  }

  handleDragEnter: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.stopPropagation()
    this.dragEnteredEls.push(event.target)
    this.setState({isDraggingOver: true})
  }

  handleDragLeave: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.stopPropagation()
    const idx = this.dragEnteredEls.indexOf(event.target)
    if (idx > -1) {
      this.dragEnteredEls.splice(idx, 1)
    }
    if (this.dragEnteredEls.length === 0) {
      this.setState({isDraggingOver: false})
    }
  }

  handleErrorClose = () => {
    if (this.state.uploadProgress !== null) {
      return
    }
    this.setState(
      {
        invalidFile: false,
        invalidPaste: false,
        error: null,
        uploadProgress: null,
      },
      () => this.container.current?.focus()
    )
  }

  handleSetupButtonClicked = () => {
    this.handleErrorClose()
    this.props.onSetupButtonClicked()
  }

  render() {
    if (this.state.uploadProgress !== null) {
      return (
        <UploadProgress
          error={this.state.error}
          onCancel={this.handleCancelUploadButtonClick!}
          progress={this.state.uploadProgress}
          fileInfo={this.state.fileInfo}
          url={this.state.url}
        />
      )
    }

    const isSigned = this.props.asset?.data?.playback_ids?.[0]?.policy === 'signed'

    return (
      <UploadCard
        onBlur={this.props.onBlur}
        onFocus={this.props.onFocus}
        onDrop={this.handleDrop}
        onDragOver={this.handleDragOver}
        onDragLeave={this.handleDragLeave}
        onDragEnter={this.handleDragEnter}
        onPaste={this.handlePaste}
        ref={this.container}
      >
        {this.state.error && (
          <ErrorDialog
            message={this.state.error.message}
            onClose={this.handleErrorClose}
            onSetup={this.handleSetupButtonClicked}
          />
        )}
        {this.props.asset ? (
          <Stack space={2}>
            {isSigned && (
              <Card padding={3} radius={2} shadow={1} tone="positive">
                <Text size={1}>This Mux asset is using a signed url.</Text>
              </Card>
            )}
            <Player
              secrets={this.props.secrets}
              readOnly={this.props.readOnly}
              videoReadyToPlay={this.props.videoReadyToPlay}
              onBrowse={this.props.onBrowse}
              onRemove={this.props.onRemove}
              onUpload={this.onUpload}
              asset={this.props.asset}
              handleVideoReadyToPlay={this.props.handleVideoReadyToPlay}
              handleRemoveVideo={this.props.handleRemoveVideo}
            />
          </Stack>
        ) : (
          <UploadPlaceholder
            onBrowse={this.props.onBrowse}
            onUpload={this.onUpload}
            isDraggingOver={this.state.isDraggingOver}
            hasFocus={this.props.hasFocus}
            invalidPaste={this.state.invalidPaste}
            invalidFile={this.state.invalidFile}
          />
        )}
      </UploadCard>
    )
  }
}

export default MuxVideoInputUploader
