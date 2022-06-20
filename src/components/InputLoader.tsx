/* eslint-disable no-nested-ternary */
/* eslint-disable no-negated-condition */
import {useId} from '@reach/auto-id'
import type {SanityClient} from '@sanity/client'
import {PlugIcon, SearchIcon, UploadIcon} from '@sanity/icons'
import {Box, Button, Card, Dialog, Flex, Grid, Heading, Inline, Text} from '@sanity/ui'
import {uuid as generateUuid} from '@sanity/uuid'
import React, {
  type ComponentProps,
  forwardRef,
  memo,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react'
import {unstable_batchedUpdates} from 'react-dom'
import {concat, defer, from, of, Subject, throwError} from 'rxjs'
import {catchError, mergeMap, mergeMapTo, switchMap, takeUntil, tap} from 'rxjs/operators'
import {useSource} from 'sanity'
import {LinearProgress} from 'sanity/_unstable'
import {PatchEvent, set, setIfMissing} from 'sanity/form'
import styled from 'styled-components'

import {getAsset} from '../actions/assets'
import {createUpChunkObservable} from '../clients/upChunkObservable'
import {type DialogState, type SetDialogState} from '../hooks/useDialogState'
import {useObservedAsset} from '../hooks/useObservedAsset'
import {useIsSecretsConfigured, useSecrets} from '../hooks/useSecrets'
import {type VideoInputProps} from '../types'
import ConfigureApi from './ConfigureApi'
import ErrorBoundaryCard from './ErrorBoundaryCard'
import FileInputButton, {type FileInputButtonProps} from './FileInputButton'
import MuxLogo from './MuxLogo'
// @ts-ignore -- fix TS typings for CSS modules
import styles from './Uploader.module.css'
import VideoActionsMenu from './VideoActionsMenu'
import VideoPlayer from './VideoPlayer'
import VideoSource from './VideoSource'
import {withFocusRing} from './withFocusRing'

function VideoIcon() {
  return (
    <svg
      data-sanity-icon="video-document"
      width="1em"
      height="1em"
      viewBox="0 0 25 25"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M 10.5 4.5 L 10.5 8.5 L 6.5 8.5 M 10.5 4.5 L 18.5 4.5 L 18.5 20.5 L 6.5 20.5 L 6.5 8.5 L 10.5 4.5 Z" />
      <polygon points="11,12 11,17 15,14.5" />
    </svg>
  )
}

function ContainerCardInner(
  props: React.ComponentProps<typeof Card>,
  ref: React.ForwardedRef<React.ComponentRef<typeof Card>>
) {
  return <Card ref={ref} tabIndex={0} sizing="border" style={{padding: 1}} {...props} />
}
const ContainerCard = memo(forwardRef(ContainerCardInner))
const FileTarget: any = withFocusRing(ContainerCard)

const MenuActionsWrapper = styled(Inline)`
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1;
`

const ButtonContainer = styled(Button)`
  z-index: 100;
`

const UploadCard = styled(Card)`
  aspect-ratio: 16 / 9;
  && {
    border-style: dashed;
  }
`

interface UploadPlaceholderProps {
  setDialogState: SetDialogState
  readOnly: boolean
  onSelect: FileInputButtonProps['onSelect']
}
function UploadPlaceholder(props: UploadPlaceholderProps) {
  const {setDialogState, readOnly, onSelect} = props
  const hoveringFiles = []
  const id = `${useId()}-upload-placeholder`
  const handleBrowse = useCallback(() => setDialogState('select-video'), [setDialogState])

  return (
    <UploadCard
      sizing="border"
      height="fill"
      tone={readOnly ? 'transparent' : 'inherit'}
      border
      padding={3}
      style={hoveringFiles.length === 0 ? undefined : {borderColor: 'transparent'}}
    >
      <Flex
        align="center"
        justify="space-between"
        gap={4}
        direction={['column', 'column', 'row']}
        paddingY={[2, 2, 0]}
        sizing="border"
        height="fill"
      >
        <Flex align="center" justify="center" gap={2} flex={1}>
          <Flex justify="center">
            <Text muted>
              <VideoIcon />
            </Text>
          </Flex>
          <Flex justify="center">
            <Text size={1} muted>
              Drag or paste video/URL here
            </Text>
          </Flex>
        </Flex>
        <Inline space={2}>
          <FileInputButton
            mode="ghost"
            icon={UploadIcon}
            text="Upload"
            id={`${id}-file`}
            accept="video/*"
            onSelect={onSelect}
          />
          <Button mode="ghost" icon={SearchIcon} text="Select" onClick={handleBrowse} />
        </Inline>
      </Flex>
    </UploadCard>
  )
}

function cancelUpload(client: SanityClient, uuid) {
  return client.observable.request({
    url: `/addons/mux/uploads/${client.config().dataset}/${uuid}`,
    withCredentials: true,
    method: 'DELETE',
  })
}

type Options = {
  enableSignedUrls?: boolean
  mp4_support?: boolean
}

function uploadUrl(client: SanityClient, url, options: Options = {}) {
  return testUrl(url).pipe(
    switchMap((validUrl) => {
      return concat(
        of({type: 'url', url: validUrl}),
        testSecretsObservable(client).pipe(
          switchMap((json: any) => {
            if (!json || !json.status) {
              return throwError(new Error('Invalid credentials'))
            }
            const uuid = generateUuid()
            const {enableSignedUrls} = options
            const muxBody = {
              input: validUrl,
              playback_policy: [enableSignedUrls ? 'signed' : 'public'],
              mp4_support: options.mp4_support,
            }
            const query = {
              muxBody: JSON.stringify(muxBody),
              filename: validUrl.split('/').slice(-1)[0],
            }

            const dataset = client.config().dataset
            return defer(() =>
              client.observable.request({
                url: `/addons/mux/assets/${dataset}`,
                withCredentials: true,
                method: 'POST',
                headers: {
                  'MUX-Proxy-UUID': uuid,
                  'Content-Type': 'application/json',
                },
                query,
              })
            ).pipe(
              mergeMap((result: any) => {
                const asset =
                  (result && result.results && result.results[0] && result.results[0].document) ||
                  null

                if (!asset) {
                  return throwError(new Error('No asset document returned'))
                }
                return of({type: 'success', id: uuid, asset})
              })
            )
          })
        )
      )
    })
  )
}

function testSecretsObservable(client: SanityClient) {
  const dataset = client.config().dataset
  return defer(() =>
    client.observable.request({
      url: `/addons/mux/secrets/${dataset}/test`,
      withCredentials: true,
      method: 'GET',
    })
  )
}

function uploadFile(client: SanityClient, file, options: Options = {}) {
  return testFile(file).pipe(
    switchMap((fileOptions) => {
      return concat(
        of({type: 'file', file: fileOptions}),
        testSecretsObservable(client).pipe(
          switchMap((json: any) => {
            if (!json || !json.status) {
              return throwError(new Error('Invalid credentials'))
            }
            const uuid = generateUuid()
            const {enableSignedUrls} = options
            const body = {
              mp4_support: options.mp4_support,
              playback_policy: [enableSignedUrls ? 'signed' : 'public'],
            }

            return concat(
              of({type: 'uuid', uuid}),
              defer(() =>
                client.observable.request({
                  url: `/addons/mux/uploads/${client.clientConfig.dataset}`,
                  withCredentials: true,
                  method: 'POST',
                  headers: {
                    'MUX-Proxy-UUID': uuid,
                    'Content-Type': 'application/json',
                  },
                  body,
                })
              ).pipe(
                mergeMap((result: any) => {
                  return createUpChunkObservable(uuid, result.upload.url, file).pipe(
                    // eslint-disable-next-line max-nested-callbacks
                    mergeMap((event: any) => {
                      if (event.type !== 'success') {
                        return of(event)
                      }
                      return from(updateAssetDocumentFromUpload(client, uuid)).pipe(
                        // eslint-disable-next-line max-nested-callbacks
                        mergeMap((doc) => of({...event, asset: doc}))
                      )
                    }),
                    // eslint-disable-next-line max-nested-callbacks
                    catchError((err) => {
                      // Delete asset document
                      return cancelUpload(client, uuid).pipe(mergeMapTo(throwError(err)))
                    })
                  )
                })
              )
            )
          })
        )
      )
    })
  )
}

function getUpload(client: SanityClient, assetId) {
  return client.request({
    url: `/addons/mux/uploads/${client.clientConfig.dataset}/${assetId}`,
    withCredentials: true,
    method: 'GET',
  })
}

function pollUpload(client: SanityClient, uuid) {
  const maxTries = 10
  let pollInterval
  let tries = 0
  let assetId
  let upload
  return new Promise((resolve, reject) => {
    pollInterval = setInterval(async () => {
      try {
        upload = await getUpload(client, uuid)
      } catch (err) {
        reject(err)
        return
      }
      assetId = upload && upload.data && upload.data.asset_id
      if (assetId) {
        clearInterval(pollInterval)
        resolve(upload)
      }
      if (tries > maxTries) {
        clearInterval(pollInterval)
        reject(new Error('Upload did not finish'))
      }
      tries++
    }, 2000)
  })
}

async function updateAssetDocumentFromUpload(client: SanityClient, uuid) {
  let upload
  let asset
  try {
    upload = await pollUpload(client, uuid)
  } catch (err) {
    return Promise.reject(err)
  }
  try {
    asset = await getAsset(client, upload.data.asset_id)
  } catch (err) {
    return Promise.reject(err)
  }

  const doc = {
    _id: uuid,
    _type: 'mux.videoAsset',
    status: asset.data.status,
    data: asset.data,
    assetId: asset.data.id,
    playbackId: asset.data.playback_ids[0].id,
    uploadId: upload.data.id,
  }
  return client.createOrReplace(doc).then(() => {
    return doc
  })
}

function testFile(file) {
  if (typeof window !== 'undefined' && file instanceof window.File) {
    const fileOptions = optionsFromFile({}, file)
    return of(fileOptions)
  }
  return throwError(new Error('Invalid file'))
}

function testUrl(url) {
  const error = new Error('Invalid URL')
  if (typeof url !== 'string') {
    return throwError(error)
  }
  let parsed
  try {
    parsed = new URL(url)
  } catch (err) {
    return throwError(error)
  }
  if (parsed && !parsed.protocol.match(/http:|https:/)) {
    return throwError(error)
  }
  return of(url)
}

function optionsFromFile(opts, file) {
  if (typeof window === 'undefined' || !(file instanceof window.File)) {
    return opts
  }
  const fileOpts = {
    filename: opts.preserveFilename === false ? undefined : file.name,
    contentType: file.type,
  }

  return {
    ...{
      filename: opts.preserveFilename === false ? undefined : file.name,
      contentType: file.type,
    },
    fileOpts,
  }
}

interface VideoUploaderProps
  extends Required<Pick<VideoInputProps, 'value' | 'onChange' | 'schemaType'>> {
  setDialogState: SetDialogState
  dialogState: DialogState
  readOnly: boolean
  // onUploadComplete: (event: any) => void
  /* const handleOnUploadComplete = useCallback(
    (result) => {
      const {_id} = result
      onChange(
        PatchEvent.from([setIfMissing({asset: {_ref: _id}}, []), set({_ref: _id}, ['asset'])])
      )
      unstable_batchedUpdates(() => {
        setAssetDocument(result.document)
        setupAssetListener()
      })
    },
    [onChange]
  ) */
}
function VideoUploader(props: VideoUploaderProps) {
  const {setDialogState, readOnly, value, dialogState, onChange, schemaType} = props
  const {client} = useSource()

  const [uploadProgress, setUploadProgress] = useState<number>(null)
  const [fileInfo, setFileInfo] = useState(null)
  const [url, setUrl] = useState<string>(null)
  const [error, setError] = useState<Error>(null)
  const [invalidPaste, setInvalidPaste] = useState(false)
  const [invalidFile, setInvalidFile] = useState(false)
  const secrets = useSecrets()

  const container = useRef(null)
  const upload = useRef(null)
  const uuid = useRef<string>(null)

  const [[onCancelUploadButtonClick$, handleCancelUploadButtonClick]] = useState(() => {
    const events$ = new Subject()
    const onClick = (event) => events$.next(event)
    const onClick$ = events$.asObservable()
    return [onClick$, onClick] as const
  })

  const onUploadComplete = useCallback(
    (result) => {
      const {_id} = result
      onChange(
        PatchEvent.from([setIfMissing({asset: {_ref: _id}}, []), set({_ref: _id}, ['asset'])])
      )
    },
    [onChange]
  )
  const handleErrorClose = useCallback((event?: any) => {
    if (event) {
      event.preventDefault()
    }
    if (uploadProgress !== null) {
      return
    }
    unstable_batchedUpdates(() => {
      setInvalidFile(false)
      setInvalidPaste(false)
      setError(null)
      setUploadProgress(null)
    })
    container.current?.focus()
  }, [])
  const handleOpenConfigureApi = useCallback(() => setDialogState('secrets'), [setDialogState])
  const handleEdit = useCallback(() => setDialogState('edit-thumbnail'), [setDialogState])
  const handleBrowse = useCallback(() => setDialogState('select-video'), [setDialogState])
  const handleSelect = useCallback(
    (files: File[]) => {
      unstable_batchedUpdates(() => {
        setUploadProgress(0)
        setFileInfo(null)
        uuid.current = null
      })

      const [file] = files
      upload.current = uploadFile(client, file, {enableSignedUrls: secrets.enableSignedUrls})
        .pipe(
          takeUntil(
            onCancelUploadButtonClick$.pipe(
              tap(() => {
                unstable_batchedUpdates(() => {
                  setUploadProgress(null)
                  setError(null)
                })
                container.current.focus()

                if (uuid.current) {
                  client.delete(uuid.current)
                }
              })
            )
          )
        )
        .subscribe({
          complete: () => {
            unstable_batchedUpdates(() => {
              setError(null)
              setUploadProgress(null)
              uuid.current = null
            })
          },
          next: (event) => {
            if (event.type === 'success') {
              unstable_batchedUpdates(() => {
                setUploadProgress(100)
                onUploadComplete(event.asset)
              })
            }

            if (event.type === 'progress') {
              unstable_batchedUpdates(() => {
                if (event.percent) {
                  setUploadProgress(event.percent)
                }
                if (event.file) {
                  setFileInfo(event.file)
                }
              })
            }

            if (event.type === 'file') {
              unstable_batchedUpdates(() => {
                setFileInfo(event.file)
                // @TODO: check if setting 0 here is correct
                setUploadProgress(0)
              })
            }

            if (event.type === 'uuid') {
              // Means we created a mux.videoAsset document with an uuid
              uuid.current = event.uuid
            }

            if (event.type === 'url') {
              unstable_batchedUpdates(() => {
                setUrl(event.url)
                setUploadProgress(100)
              })
            }
          },
          error: (err) => {
            unstable_batchedUpdates(() => {
              setError(err)
              setUploadProgress(null)
              uuid.current = null
            })
          },
        })
    },
    [client, onCancelUploadButtonClick$, onUploadComplete, secrets.enableSignedUrls]
  )
  const asset = useObservedAsset({reference: value?.asset})

  // console.log('VideoUploader', asset)

  const mode: 'error' | 'uploading' | 'placeholder' | 'asset' =
    error !== null
      ? 'error'
      : uploadProgress !== null
      ? 'uploading'
      : asset && asset?.status
      ? 'asset'
      : 'placeholder'

  const renderError = useMemo(() => {
    if (!error) {
      return null
    }
    if (uploadProgress !== null) {
      return null
    }
    let message: React.ReactNode = error.message
    if (message === 'Invalid credentials') {
      message = (
        <div>
          <h3>Invalid credentials</h3>
          <p>You need to check your Mux access token and secret key.</p>
          <Button
            text="Run setup"
            tone="primary"
            padding={3}
            onClick={() => setDialogState('secrets')}
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
        onClose={handleErrorClose}
        // onEscape={this.handleErrorClose}
        onClickOutside={handleErrorClose}
      >
        <Box padding={4}>
          <Text>{message}</Text>
        </Box>
      </Dialog>
    )
  }, [])
  const renderUploadProgress = useMemo(() => {
    if (uploadProgress === null) {
      return null
    }
    let text =
      uploadProgress < 100
        ? `Uploading ${fileInfo ? `'${fileInfo.name}'` : 'file'}`
        : 'Waiting for Mux to complete the file'
    if (error) {
      text = error.message
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
        {(uploadProgress < 100 || error) && (
          <div>
            <Button
              text="Cancel upload"
              padding={3}
              tone="critical"
              onClick={handleCancelUploadButtonClick}
            />
          </div>
        )}
      </div>
    )
  }, [])
  const renderUploadPlaceHolder = useMemo(() => {
    if (mode !== 'placeholder') {
      return null
    }
    // @TODO: implement these drag and drop states
    // const {invalidFile, invalidPaste, isDraggingOver} = this.state
    return (
      <div style={{padding: 1, position: 'relative'}}>
        <MenuActionsWrapper data-buttons space={1} padding={2}>
          <ButtonContainer icon={PlugIcon} mode="bleed" onClick={handleOpenConfigureApi} />
        </MenuActionsWrapper>
        <UploadPlaceholder
          setDialogState={setDialogState}
          readOnly={readOnly}
          onSelect={handleSelect}
        />
      </div>
    )
  }, [])

  return (
    <FileTarget
      ref={container}
      // @TODO: deal with focus events
      // onFocus={onFocus}
      // onBlur={onBlur}
      /* @TODO: reimplement these
        onDrop={this.handleDrop}
        onKeyDown={this.handleKeyDown}
        onDragOver={this.handleDragOver}
        onDragLeave={this.handleDragLeave}
        onDragEnter={this.handleDragEnter}
        @TODO: is this trick needed to handle paste?
        <input
          ref={this.hiddenTextField}
          className={styles.hiddenTextField}
          type="text"
          onPaste={this.handlePaste}
        />
        */
    >
      {renderError}
      {renderUploadProgress}
      {renderUploadPlaceHolder}
      {mode === 'asset' && (
        <ErrorBoundaryCard schemaType={schemaType}>
          <VideoPlayer
            dialogState={dialogState}
            setDialogState={setDialogState}
            asset={asset}
            buttons={
              <VideoActionsMenu
                onEdit={handleEdit}
                readOnly={readOnly}
                onBrowse={handleBrowse}
                // onSelect={handleSelect}
                onConfigureApi={handleOpenConfigureApi}
                dialogState={dialogState}
                setDialogState={setDialogState}
                onChange={onChange}
              />
            }
          />
        </ErrorBoundaryCard>
      )}
    </FileTarget>
  )
}

interface OnboardProps {
  setDialogState: SetDialogState
}

function Onboard(props: OnboardProps) {
  const {setDialogState} = props
  const handleOpen = useCallback(() => setDialogState('secrets'), [setDialogState])

  return (
    <>
      <div style={{padding: 2}}>
        <Card
          display="flex"
          sizing="border"
          style={{aspectRatio: '16/9', width: '100%', boxShadow: 'var(--card-bg-color) 0 0 0 2px'}}
          paddingX={[2, 3, 4, 4]}
          radius={1}
          tone="transparent"
        >
          <Flex justify="flex-start" align="center">
            <Grid columns={1} gap={[2, 3, 4, 4]}>
              <Inline paddingY={1}>
                <div style={{height: '32px'}}>
                  <MuxLogo />
                </div>
              </Inline>
              <Inline paddingY={1}>
                <Heading size={[0, 1, 2, 2]}>
                  Upload and preview videos directly from your studio.
                </Heading>
              </Inline>
              <Inline paddingY={1}>
                <Button mode="ghost" icon={PlugIcon} text="Configure API" onClick={handleOpen} />
              </Inline>
            </Grid>
          </Flex>
        </Card>
      </div>
    </>
  )
}

// Designed to be a React.lazy entrypoint, to codesplit the majority of the input plugin and load it on demand
// TODO: use exported props instead of using the ComponentProps generic
export type InputLoaderProps = Pick<
  ComponentProps<typeof VideoUploader> &
    ComponentProps<typeof ConfigureApi> &
    ComponentProps<typeof Onboard> &
    ComponentProps<typeof VideoSource>,
  'onChange' | 'readOnly' | 'setDialogState' | 'value' | 'schemaType'
> & {
  dialogState: DialogState
}
function InputLoader(props: InputLoaderProps) {
  const {dialogState, onChange, readOnly, setDialogState, value, schemaType} = props
  const isSecretsConfigured = useIsSecretsConfigured()

  return (
    <>
      {isSecretsConfigured ? (
        <VideoUploader
          readOnly={readOnly}
          setDialogState={setDialogState}
          value={value}
          dialogState={dialogState}
          onChange={onChange}
          schemaType={schemaType}
        />
      ) : (
        <Onboard setDialogState={setDialogState} />
      )}
      {dialogState === 'secrets' && <ConfigureApi setDialogState={setDialogState} />}
      {dialogState === 'select-video' && (
        <VideoSource setDialogState={setDialogState} onChange={onChange} value={value} />
      )}
    </>
  )
}

export default memo(InputLoader)
