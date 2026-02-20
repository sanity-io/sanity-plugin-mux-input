import {ErrorOutlineIcon} from '@sanity/icons'
import {Button, CardTone, Flex, Text, useToast} from '@sanity/ui'
import React, {useCallback, useEffect, useReducer, useRef, useState} from 'react'
import {type Observable, Subject, Subscription} from 'rxjs'
import {takeUntil, tap} from 'rxjs/operators'
import type {SanityClient} from 'sanity'
import {PatchEvent, set, setIfMissing} from 'sanity'

import {uploadFile, uploadUrl} from '../actions/upload'
import {DialogStateProvider} from '../context/DialogStateContext'
import {type DialogState, type SetDialogState} from '../hooks/useDialogState'
import {isServerError, isValidUrl} from '../util/asserters'
import {extractDroppedFiles} from '../util/extractFiles'
import {hasPlaybackPolicy} from '../util/getPlaybackPolicy'
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
  | {action: 'error'; error: Error; settings: MuxNewAssetSettings}
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
  const uploadingDocumentId = useRef<string | null>(null)
  const [state, dispatch] = useReducer(
    (prev: State, action: UploaderStateAction) => {
      switch (action.action) {
        case 'stageUpload':
          return Object.assign({}, INITIAL_STATE, {stagedUpload: action.input})
        case 'commitUpload':
          return Object.assign({}, prev, {uploadStatus: {progress: 0}})
        case 'progressInfo': {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
          uploadingDocumentId.current = null
          return INITIAL_STATE
        case 'error': {
          // Clear upload observable on error
          uploadRef.current?.unsubscribe()
          uploadRef.current = null
          uploadingDocumentId.current = null

          let error = action.error
          if (isServerError(action.error) && hasPlaybackPolicy(action.settings, 'drm')) {
            error = new Error(
              'Unknown Error while uploading DRM protected content. Make sure your DRM configuration ID is valid and set correctly'
            )
          }

          return Object.assign({}, INITIAL_STATE, {error: error})
        }
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
  // and cleanup orphaned documents if upload was in progress
  useEffect(() => {
    const cleanup = () => {
      // Cancel subscription
      if (uploadRef.current && !uploadRef.current.closed) {
        uploadRef.current.unsubscribe()
      }

      // Delete orphaned document if upload was in progress and document is different from the saved asset
      if (uploadingDocumentId.current && props.asset?._id !== uploadingDocumentId.current) {
        const docId = uploadingDocumentId.current
        uploadingDocumentId.current = null

        props.client.delete(docId).catch((err) => {
          console.warn('Failed to cleanup orphaned upload document:', err)
        })
      }
    }

    const handleBeforeUnload = () => {
      cleanup()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('pagehide', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('pagehide', handleBeforeUnload)
      cleanup()
    }
  }, [props.client, props.asset?._id])

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
                if (uploadingDocumentId.current) {
                  props.client.delete(uploadingDocumentId.current)
                  uploadingDocumentId.current = null
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
            // Track the document ID for cleanup on unmount
            uploadingDocumentId.current = event.uuid
            dispatch({action: 'progressInfo', ...event})
            break
          case 'file':
          case 'url':
            dispatch({action: 'progressInfo', ...event})
            break
          case 'progress':
            dispatch({action: 'progress', percent: event.percent})
            break
          case 'success':
            dispatch({action: 'progress', percent: 100})
            uploadingDocumentId.current = null
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
      error: (error) => dispatch({action: 'error', error, settings}),
    })
  }

  const invalidFileToast = useCallback(() => {
    toast.push({
      status: 'error',
      title: `Invalid file type. Accepted types: ${props.config.acceptedMimeTypes?.join(', ')}`,
    })
  }, [props.config.acceptedMimeTypes, toast])

  /**
   * Validates if any file in the provided FileList or File array has an unsupported MIME type
   * @param files - FileList or File array to validate
   * @returns true if any file has an invalid MIME type, false if all files are valid
   */
  const isInvalidFile = (files: FileList | File[]) => {
    const isInvalid = Array.from(files).some((file) => {
      return !props.config.acceptedMimeTypes?.some((acceptedType) => {
        // Convert mime type pattern to regex (e.g., 'audio/*' -> /^audio\/.*$/)
        const pattern = `^${acceptedType.replace('*', '.*')}$`
        return new RegExp(pattern).test(file.type)
      })
    })

    return isInvalid
  }

  /* -------------------------- Upload Initialization ------------------------- */
  // The below populate the uploadInput state field, which then triggers the
  // upload configuration, or the startUpload function if no config is required.

  // Stages an upload from the file selector
  const handleUpload = (files: FileList | File[]) => {
    if (isInvalidFile(files)) return
    dispatch({
      action: 'stageUpload',
      input: {type: 'file', files},
    })
  }

  // Stages and validates an upload from pasting an asset URL
  const handlePaste: React.ClipboardEventHandler<HTMLInputElement> = (event) => {
    const target = event.target as HTMLElement

    // Ignore paste coming from the VTT URL input
    if (target.closest('#vtt-url')) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    const clipboardData =
      event.clipboardData || (window as Window & {clipboardData?: DataTransfer}).clipboardData
    const url = clipboardData?.getData('text')?.trim()
    if (!isValidUrl(url)) {
      toast.push({status: 'error', title: 'Invalid URL for Mux video input.'})
      return
    }
    dispatch({action: 'stageUpload', input: {type: 'url', url: url}})
  }

  // Stages and validates an upload from dragging+dropping files or folders
  const handleDrop: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault()
    event.stopPropagation()
    if (dragState === 'invalid') {
      invalidFileToast()
      setDragState(null)
      return
    }
    setDragState(null)
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
    const mimeTypes = props.config.acceptedMimeTypes

    // Check if the dragged file type matches any of the accepted mime types
    const isValidType = mimeTypes?.some((acceptedType) => {
      // Convert mime type pattern to regex (e.g., 'video/*' -> /^video\/.*$/)
      const pattern = `^${acceptedType.replace('*', '.*')}$`
      return new RegExp(pattern).test(type)
    })

    setDragState(isValidType ? 'valid' : 'invalid')
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
    const error = state.error
    return (
      <Flex gap={3} direction="column" justify="center" align="center">
        <Text size={5} muted>
          <ErrorOutlineIcon />
        </Text>
        <Text>Something went wrong</Text>
        {error instanceof Error && error.message && (
          <Text size={1} muted weight="semibold" style={{textAlign: 'center'}}>
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

  const acceptMimeString = props.config?.acceptedMimeTypes?.length
    ? props.config.acceptedMimeTypes.join(',')
    : 'video/*, audio/*'

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
          <DialogStateProvider
            dialogState={props.dialogState}
            setDialogState={props.setDialogState}
          >
            <Player
              readOnly={props.readOnly}
              asset={props.asset}
              onChange={props.onChange}
              config={props.config}
              buttons={
                <PlayerActionsMenu
                  accept={acceptMimeString}
                  asset={props.asset}
                  dialogState={props.dialogState}
                  setDialogState={props.setDialogState}
                  onChange={props.onChange}
                  onSelect={handleUpload}
                  readOnly={props.readOnly}
                  config={props.config}
                />
              }
            />
          </DialogStateProvider>
        ) : (
          <UploadPlaceholder
            accept={acceptMimeString}
            hovering={dragState !== null}
            onSelect={handleUpload}
            readOnly={!!props.readOnly}
            setDialogState={props.setDialogState}
            needsSetup={props.needsSetup}
            config={props.config}
          />
        )}
      </UploadCard>
      {props.dialogState === 'select-video' && (
        <InputBrowser
          config={props.config}
          asset={props.asset}
          onChange={props.onChange}
          setDialogState={props.setDialogState}
        />
      )}
    </>
  )
}
