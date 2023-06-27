/* eslint-disable no-nested-ternary */
// This component needs to be refactored into a functional component

import React, {lazy, Component} from 'react'
import {type Observable, Subject} from 'rxjs'
import {takeUntil, tap} from 'rxjs/operators'
import type {SanityClient} from 'sanity'
import {PatchEvent, set, setIfMissing} from 'sanity'

import {uploadFile, uploadUrl} from '../actions/upload'
import {type DialogState, type SetDialogState} from '../hooks/useDialogState'
import {extractDroppedFiles} from '../util/extractFiles'
import type {Config, MuxInputProps, Secrets, VideoAssetDocument} from '../util/types'
import InputBrowser from './InputBrowser'
import PlayerActionsMenu from './PlayerActionsMenu'
import {UploadCard} from './Uploader.styled'
import UploadPlaceholder from './UploadPlaceholder'
import {UploadProgress} from './UploadProgress'

// TODO: Without this lazy load call a build error occurs in the Player component from the import
// of media-chrome components. media-chrome ships separate ESM and CJS compatible modules in versions >=1.0.0.
// Once the plugin is updated to media-chrome >= 1.0.0, remove this lazy load.
// import Player from './Player'
const Player = lazy(() => import('./Player'))

interface Props extends Pick<MuxInputProps, 'onChange' | 'readOnly'> {
  config: Config
  client: SanityClient
  secrets: Secrets
  asset: VideoAssetDocument | null | undefined
  dialogState: DialogState
  setDialogState: SetDialogState
  needsSetup: boolean
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

  onUpload = (files: FileList | File[]) => {
    this.setState({uploadProgress: 0, fileInfo: null, uuid: null})
    this.upload = uploadFile(this.props.config, this.props.client, files[0], {
      enableSignedUrls: this.props.secrets.enableSignedUrls,
    })
      .pipe(
        takeUntil(
          this.onCancelUploadButtonClick$!.pipe(
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
    this.props.onChange(
      PatchEvent.from([
        setIfMissing({asset: {}}),
        set({_type: 'reference', _weak: true, _ref: asset._id}, ['asset']),
      ])
    )
  }

  handlePaste: React.ClipboardEventHandler<HTMLInputElement> = (event) => {
    const clipboardData = event.clipboardData || (window as any).clipboardData
    const url = clipboardData.getData('text')
    const options = {enableSignedUrls: this.props.secrets.enableSignedUrls}

    this.upload = uploadUrl(this.props.config, this.props.client, url, options).subscribe({
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
    const type = event.dataTransfer.items?.[0]?.type
    this.setState({invalidFile: !type.startsWith('video/')})
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

  render() {
    if (this.state.uploadProgress !== null) {
      return (
        <UploadProgress
          onCancel={this.handleCancelUploadButtonClick!}
          progress={this.state.uploadProgress}
          filename={this.state.fileInfo?.name || this.state.url}
        />
      )
    }

    if (this.state.error) {
      // @TODO better error handling
      throw this.state.error
    }

    return (
      <>
        <UploadCard
          tone={
            this.state.isDraggingOver && (this.state.invalidPaste || this.state.invalidFile)
              ? 'critical'
              : this.state.isDraggingOver
              ? 'positive'
              : undefined
          }
          onDrop={this.handleDrop}
          onDragOver={this.handleDragOver}
          onDragLeave={this.handleDragLeave}
          onDragEnter={this.handleDragEnter}
          onPaste={this.handlePaste}
          ref={this.container}
        >
          {this.props.asset ? (
            <Player
              readOnly={this.props.readOnly}
              asset={this.props.asset}
              onChange={this.props.onChange}
              dialogState={this.props.dialogState}
              setDialogState={this.props.setDialogState}
              buttons={
                <PlayerActionsMenu
                  asset={this.props.asset}
                  dialogState={this.props.dialogState}
                  setDialogState={this.props.setDialogState}
                  onChange={this.props.onChange}
                  onUpload={this.onUpload}
                  readOnly={this.props.readOnly}
                />
              }
            />
          ) : (
            <UploadPlaceholder
              hovering={this.state.isDraggingOver}
              onSelect={this.onUpload}
              readOnly={this.props.readOnly!}
              setDialogState={this.props.setDialogState}
              needsSetup={this.props.needsSetup}
            />
          )}
        </UploadCard>
        {this.props.dialogState === 'select-video' && (
          <InputBrowser
            asset={this.props.asset}
            onChange={this.props.onChange}
            setDialogState={this.props.setDialogState}
          />
        )}
      </>
    )
  }
}

export default MuxVideoInputUploader
