/* eslint-disable no-nested-ternary */
// This component needs to be refactored into a functional component

import {ErrorOutlineIcon} from '@sanity/icons'
import {Flex, Text} from '@sanity/ui'
import React, {Component} from 'react'
import {Subject, type Observable} from 'rxjs'
import {takeUntil, tap} from 'rxjs/operators'
import type {SanityClient} from 'sanity'
import {PatchEvent, set, setIfMissing} from 'sanity'
import {testFile, testUrl, uploadFile, uploadUrl} from '../actions/upload'
import {type DialogState, type SetDialogState} from '../hooks/useDialogState'
import {extractDroppedFiles} from '../util/extractFiles'
import type {
  MuxInputProps,
  PluginConfig,
  Secrets,
  StagedUpload,
  UploadConfig,
  VideoAssetDocument,
} from '../util/types'
import InputBrowser from './InputBrowser'
import Player from './Player'
import PlayerActionsMenu from './PlayerActionsMenu'
import UploadConfiguration from './UploadConfiguration'
import UploadPlaceholder from './UploadPlaceholder'
import {UploadProgress} from './UploadProgress'
import {UploadCard} from './Uploader.styled'

interface Props extends Pick<MuxInputProps, 'onChange' | 'readOnly'> {
  config: PluginConfig
  client: SanityClient
  secrets: Secrets
  asset: VideoAssetDocument | null | undefined
  dialogState: DialogState
  setDialogState: SetDialogState
  needsSetup: boolean
}

type State = {
  isDraggingOver: boolean
  invalidPaste: boolean
  invalidFile: boolean
  fileInfo: {name?: string; type?: string} | null
  uuid: null
  uploadProgress: number | null
  error: Error | null
  uploadConfig: UploadConfig
} & (
  | {
      state: 'idle'
      stagedUpload: null
    }
  | {
      state: 'configuring' | 'uploading' | 'error'
      stagedUpload: StagedUpload
    }
)

class MuxVideoInputUploader extends Component<Props, State> {
  state: State = {
    isDraggingOver: false,
    invalidPaste: false,
    invalidFile: false,
    uploadProgress: null,
    fileInfo: null,
    uuid: null,
    error: null,
    state: 'idle',
    stagedUpload: null,
    uploadConfig: {
      filename: '',
      encoding_tier: this.props.config.encoding_tier || 'smart',
      max_resolution_tier: this.props.config.max_resolution_tier || '1080p',
      mp4_support: this.props.config.mp4_support || 'none',
      signed: this.props.config.defaultSigned || false,
      text_tracks: [],
    },
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

  onUpload = () => {
    const {stagedUpload} = this.state

    if (stagedUpload?.type === 'file') {
      this.setState({uploadProgress: 0, fileInfo: null, uuid: null, state: 'uploading'})

      this.upload = uploadFile({
        client: this.props.client,
        file: stagedUpload.file,
        uploadConfig: this.state.uploadConfig,
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
            this.setState({error: null, state: 'idle', uploadProgress: null, uuid: null})
          },
          next: (event) => {
            this.handleUploadEvent(event)
          },
          error: (err) => {
            this.setState({error: err, state: 'error', uploadProgress: null, uuid: null})
          },
        })
    }

    if (stagedUpload?.type === 'url') {
      this.upload = uploadUrl({
        client: this.props.client,
        url: stagedUpload.url,
        uploadConfig: this.state.uploadConfig,
      }).subscribe({
        complete: () => {
          this.setState((prev) => ({...prev, error: null, uploadProgress: null, url: undefined}))
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
  }

  onSelect = (filesR: File[] | FileList) => {
    const files = filesR ? Array.from(filesR) : []
    const file = files[0]

    testFile(file).subscribe({
      complete: () => {
        this.setState((prev) => ({
          ...prev,
          state: 'configuring',
          stagedUpload: {
            type: 'file',
            file,
          },
          uploadConfig: {
            ...prev.uploadConfig,
            filename: file.name,
          },
        }))
      },
      error: () =>
        this.setState({invalidFile: true}, () => {
          setTimeout(() => {
            this.setState({invalidFile: false})
          }, 2000)
        }),
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
        return this.setState((prev) => ({...prev, url: event.url, uploadProgress: 100}))
      default:
        return null
    }
  }

  handleUploadSuccess = (asset: VideoAssetDocument) => {
    this.setState({uploadProgress: 100})
    this.props.onChange(
      PatchEvent.from([
        setIfMissing({asset: {}, _type: 'mux.video'}),
        set({_type: 'reference', _weak: true, _ref: asset._id}, ['asset']),
      ])
    )
  }

  handlePaste: React.ClipboardEventHandler<HTMLInputElement> = (event) => {
    const clipboardData = event.clipboardData || (window as any).clipboardData
    const url = clipboardData.getData('text')

    testUrl(url).subscribe({
      complete: () => {
        this.setState({
          state: 'configuring',
          stagedUpload: {
            type: 'url',
            url,
          },
        })
        this.setState((prev) => ({
          ...prev,
          state: 'configuring',
          stagedUpload: {
            type: 'url',
            url,
          },
          uploadConfig: {
            ...prev.uploadConfig,
            filename: url.split('/').slice(-1)[0],
          },
        }))
      },
      error: () =>
        this.setState({invalidPaste: true}, () => {
          setTimeout(() => {
            this.setState({invalidPaste: false})
          }, 2000)
        }),
    })
  }

  handleDrop: React.DragEventHandler<HTMLDivElement> = (event) => {
    this.setState({isDraggingOver: false})
    event.preventDefault()
    event.stopPropagation()
    extractDroppedFiles(event.nativeEvent.dataTransfer!).then((files) => {
      this.onSelect(files)
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
    const {stagedUpload} = this.state
    if (this.state.uploadProgress !== null && stagedUpload) {
      let filename = this.state.fileInfo?.name
      if (stagedUpload.type === 'url') filename = stagedUpload.url || filename
      if (stagedUpload.type === 'file') filename = stagedUpload.file?.name || filename

      return (
        <UploadProgress
          onCancel={this.handleCancelUploadButtonClick!}
          progress={this.state.uploadProgress}
          filename={filename}
        />
      )
    }

    if (this.state.state === 'error') {
      return (
        <Flex gap={3} direction="column" justify="center" align="center">
          <Text size={5} muted>
            <ErrorOutlineIcon />
          </Text>
          <Text>Something went wrong</Text>
          {this.state.error?.message && (
            <Text size={1} muted>
              {this.state.error.message}
            </Text>
          )}
        </Flex>
      )
    }

    if (this.state.state === 'configuring') {
      return (
        <UploadConfiguration
          pluginConfig={this.props.config}
          secrets={this.props.secrets}
          stagedUpload={this.state.stagedUpload}
          uploadConfig={this.state.uploadConfig}
          startUpload={this.onUpload}
          setUploadConfig={(uploadConfig) =>
            this.setState({
              uploadConfig,
            })
          }
          cancelUpload={() => {
            this.setState((prev) => ({...prev, files: undefined, url: undefined, state: 'idle'}))
          }}
        />
      )
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
              buttons={
                <PlayerActionsMenu
                  asset={this.props.asset}
                  dialogState={this.props.dialogState}
                  setDialogState={this.props.setDialogState}
                  onChange={this.props.onChange}
                  onSelect={this.onSelect}
                  readOnly={this.props.readOnly}
                />
              }
            />
          ) : (
            <UploadPlaceholder
              hovering={this.state.isDraggingOver}
              onSelect={this.onSelect}
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
