import {ErrorOutlineIcon} from '@sanity/icons'
import {Button, CardTone, Flex, Text, useToast} from '@sanity/ui'
import React, {useEffect, useReducer, useRef, useState} from 'react'
import {type Observable, Subject, Subscription} from 'rxjs'
import {takeUntil, tap} from 'rxjs/operators'
import type {SanityClient} from 'sanity'
import {PatchEvent, set, setIfMissing} from 'sanity'

import {uploadFile, uploadUrl} from '../actions/upload'
import {type DialogState, type SetDialogState} from '../hooks/useDialogState'
import {isValidUrl} from '../util/asserters'
import {extractDroppedFiles} from '../util/extractFiles'
import type {
  MuxInputProps,
  MuxNewAssetSettings,
  PluginConfig,
  Secrets,
  VideoAssetDocument,
} from '../util/types'
import InputBrowser from './InputBrowser'
import Player from './Player'
import PlayerActionsMenu from './PlayerActionsMenu'
import UploadConfiguration from './UploadConfiguration'
import {UploadCard} from './Uploader.styled'
import UploadPlaceholder from './UploadPlaceholder'
import {UploadProgress} from './UploadProgress'

interface Props extends Pick<MuxInputProps, 'onChange' | 'readOnly'> {
  config: PluginConfig
  client: SanityClient
  secrets: Secrets
  asset: VideoAssetDocument | null | undefined
  dialogState: DialogState
  setDialogState: SetDialogState
  needsSetup: boolean
}

export type StagedUpload = {type: 'file'; files: FileList | File[]} | {type: 'url'; url: string}
type UploadStatus = {
  progress: number
  file?: {name: string | undefined; type: string}
  uuid?: string
  url?: string
}

interface State {
  stagedUpload: StagedUpload | null
  uploadStatus: UploadStatus | null
  error: Error | null
}

const INITIAL_STATE: State = {
  stagedUpload: null,
  uploadStatus: null,
  error: null,
}

type UploadFileEvent = ReturnType<typeof uploadFile> extends Observable<infer T> ? T : never
type UploadUrlEvent = ReturnType<typeof uploadUrl> extends Observable<infer T> ? T : never
type UploaderStateAction =
  | {action: 'stageUpload'; input: NonNullable<State['stagedUpload']>}
  | {action: 'commitUpload'}
  | ({action: 'progressInfo'} & (
      | Extract<UploadFileEvent, {type: 'uuid' | 'file'}>
      | Extract<UploadUrlEvent, {type: 'url'}>
    ))
  | {action: 'progress'; percent: number}
  | {action: 'error'; error: any}
  | {action: 'complete' | 'reset'}

/**
 * The main interface for inputting a Mux Video. It handles staging an upload
 * file, setting its configuration, displaying upload progress, and showing
 * the preview player.
 */
export default function Uploader(props: Props) {
  const toast = useToast()
  const containerRef = useRef<HTMLDivElement>(null)

  const dragEnteredEls = useRef<EventTarget[]>([])
  const [dragState, setDragState] = useState<'valid' | 'invalid' | null>(null)

  const cancelUploadButton = useRef(
    (() => {
      const events$ = new Subject()
      return {
        observable: events$.asObservable(),
        handleClick: ((event) => events$.next(event)) as React.MouseEventHandler<HTMLButtonElement>,
      }
    })()
  ).current

  const uploadRef = useRef<Subscription | null>(null)
  const [state, dispatch] = useReducer(
    (prev: State, action: UploaderStateAction) => {
      switch (action.action) {
        case 'stageUpload':
          return Object.assign({}, INITIAL_STATE, {stagedUpload: action.input})
        case 'commitUpload':
          return Object.assign({}, prev, {uploadStatus: {progress: 0}})
        case 'progressInfo': {
          const {type, action: _, ...payload} = action
          return Object.assign({}, prev, {
            uploadStatus: {
              ...prev.uploadStatus,
              progress: prev.uploadStatus!.progress,
              ...payload,
            },
          } satisfies Pick<typeof prev, 'uploadStatus'>)
        }
        case 'progress':
          return Object.assign({}, prev, {
            uploadStatus: {
              ...prev.uploadStatus,
              progress: action.percent,
            },
          } satisfies Pick<typeof prev, 'uploadStatus'>)
        case 'reset':
        case 'complete':
          // Clear upload observable on completion
          uploadRef.current?.unsubscribe()
          uploadRef.current = null
          return INITIAL_STATE
        case 'error':
          // Clear upload observable on error
          uploadRef.current?.unsubscribe()
          uploadRef.current = null
          return Object.assign({}, INITIAL_STATE, {error: action.error})
        default:
          return prev
      }
    },
    {
      stagedUpload: null,
      uploadStatus: null,
      error: null,
    }
  )

  // Make sure we close out the upload observer on dismount
  useEffect(() => {
    return () => {
      if (uploadRef.current && !uploadRef.current.closed) {
        uploadRef.current.unsubscribe()
      }
    }
  }, [])

  /* -------------------------------------------------------------------------- */
  /*                                  Uploading                                 */
  /* -------------------------------------------------------------------------- */

  /**
   * Begins a file or URL upload with the staged files or URL.
   *
   * Should only be called from the UploadConfiguration component, which provides
   * the Mux configuration for the direct asset upload.
   *
   * @param settings The Mux new_asset_settings object to send to Sanity
   * @returns
   */
  const startUpload = (settings: MuxNewAssetSettings) => {
    const {stagedUpload} = state
    if (!stagedUpload || uploadRef.current) return
    dispatch({action: 'commitUpload'})
    let uploadObservable: Observable<UploadFileEvent | UploadUrlEvent>
    // eslint-disable-next-line default-case
    switch (stagedUpload.type) {
      case 'url':
        uploadObservable = uploadUrl({
          client: props.client,
          url: stagedUpload.url,
          settings,
        })
        break
      case 'file':
        uploadObservable = uploadFile({
          client: props.client,
          file: stagedUpload.files[0],
          settings,
        }).pipe(
          takeUntil(
            cancelUploadButton.observable.pipe(
              tap(() => {
                if (state.uploadStatus?.uuid) {
                  props.client.delete(state.uploadStatus.uuid)
                }
              })
            )
          )
        )
        break
    }
    uploadRef.current = uploadObservable.subscribe({
      next: (event) => {
        switch (event.type) {
          case 'uuid':
          case 'file':
          case 'url':
            dispatch({action: 'progressInfo', ...event})
            break
          case 'progress':
            dispatch({action: 'progress', percent: event.percent})
            break
          case 'success':
            dispatch({action: 'progress', percent: 100})
            props.onChange(
              PatchEvent.from([
                setIfMissing({asset: {}}),
                set({_type: 'reference', _weak: true, _ref: event.asset._id}, ['asset']),
              ])
            )
            break
          case 'pause':
          case 'resume':
          default:
            break
        }
      },
      complete: () => dispatch({action: 'complete'}),
      error: (error) => dispatch({action: 'error', error}),
    })
  }

  /* -------------------------- Upload Initialization ------------------------- */
  // The below populate the uploadInput state field, which then triggers the
  // upload configuration, or the startUpload function if no config is required.

  // Stages an upload from the file selector
  const handleUpload = (files: FileList | File[]) => {
    dispatch({
      action: 'stageUpload',
      input: {type: 'file', files},
    })
  }

  // Stages and validates an upload from pasting an asset URL
  const handlePaste: React.ClipboardEventHandler<HTMLInputElement> = (event) => {
    event.preventDefault()
    event.stopPropagation()
    const clipboardData = event.clipboardData || (window as any).clipboardData
    const url = clipboardData.getData('text')
    if (!isValidUrl(url)) {
      toast.push({status: 'error', title: 'Invalid URL for Mux video input.'})
      return
    }
    dispatch({action: 'stageUpload', input: {type: 'url', url: url}})
  }

  // Stages and validates an upload from dragging+dropping files or folders
  const handleDrop: React.DragEventHandler<HTMLDivElement> = (event) => {
    setDragState(null)
    event.preventDefault()
    event.stopPropagation()
    extractDroppedFiles(event.nativeEvent.dataTransfer!).then((files) => {
      dispatch({
        action: 'stageUpload',
        input: {type: 'file', files},
      })
    })
  }

  /* ------------------------------- Drag State ------------------------------- */

  const handleDragOver: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const handleDragEnter: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.stopPropagation()
    dragEnteredEls.current.push(event.target)
    const type = event.dataTransfer.items?.[0]?.type
    setDragState(type?.startsWith('video/') ? 'valid' : 'invalid')
  }

  const handleDragLeave: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.stopPropagation()
    const idx = dragEnteredEls.current.indexOf(event.target)
    if (idx > -1) {
      dragEnteredEls.current.splice(idx, 1)
    }
    if (dragEnteredEls.current.length === 0) {
      setDragState(null)
    }
  }

  /* -------------------------------- Rendering ------------------------------- */

  // Upload has errored
  if (state.error !== null) {
    const error = {state}
    return (
      <Flex gap={3} direction="column" justify="center" align="center">
        <Text size={5} muted>
          <ErrorOutlineIcon />
        </Text>
        <Text>Something went wrong</Text>
        {error instanceof Error && error.message && (
          <Text size={1} muted>
            {error.message}
          </Text>
        )}
        <Button text="Upload another file" onClick={() => dispatch({action: 'reset'})} />
      </Flex>
    )
  }

  // Upload is in progress
  if (state.uploadStatus !== null) {
    const {uploadStatus} = state
    return (
      <UploadProgress
        onCancel={cancelUploadButton.handleClick}
        progress={uploadStatus.progress}
        filename={uploadStatus.file?.name || uploadStatus.url}
      />
    )
  }

  // Upload needs configuration
  if (state.stagedUpload !== null) {
    return (
      <UploadConfiguration
        stagedUpload={state.stagedUpload}
        pluginConfig={props.config}
        secrets={props.secrets}
        startUpload={startUpload}
        onClose={() => dispatch({action: 'reset'})}
      />
    )
  }

  // Default: No staged upload
  let tone: CardTone | undefined
  if (dragState) tone = dragState === 'valid' ? 'positive' : 'critical'

  return (
    <>
      <UploadCard
        tone={tone}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDragEnter={handleDragEnter}
        onPaste={handlePaste}
        ref={containerRef}
      >
        {props.asset ? (
          <Player
            readOnly={props.readOnly}
            asset={props.asset}
            onChange={props.onChange}
            buttons={
              <PlayerActionsMenu
                asset={props.asset}
                dialogState={props.dialogState}
                setDialogState={props.setDialogState}
                onChange={props.onChange}
                onSelect={handleUpload}
                readOnly={props.readOnly}
              />
            }
          />
        ) : (
          <UploadPlaceholder
            hovering={dragState !== null}
            onSelect={handleUpload}
            readOnly={!!props.readOnly}
            setDialogState={props.setDialogState}
            needsSetup={props.needsSetup}
          />
        )}
      </UploadCard>
      {props.dialogState === 'select-video' && (
        <InputBrowser
          asset={props.asset}
          onChange={props.onChange}
          setDialogState={props.setDialogState}
        />
      )}
    </>
  )
}
