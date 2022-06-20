/* eslint-disable consistent-return */
/* eslint-disable max-statements */
/* eslint-disable no-warning-comments */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable max-nested-callbacks */
/* eslint-disable no-console */

import {useSource} from 'sanity'
import {useDocumentPreviewStore} from 'sanity/_unstable'
import {
  PatchEvent,
  // set,
  // setIfMissing,
  unset,
  useFormValue,
} from 'sanity/form'
import type {SanityDocument} from 'sanity'
import {Box, Card, Flex, Spinner, Text} from '@sanity/ui'
import React, {
  ForwardedRef,
  forwardRef,
  lazy,
  memo,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import {unstable_batchedUpdates} from 'react-dom'
import {of} from 'rxjs'
import {tap} from 'rxjs/operators'
import styled from 'styled-components'

import {deleteAsset, getAsset} from '../actions/assets'
import {useDialogState} from '../hooks/useDialogState'
import {useObservableAsset} from '../hooks/useObservableAsset'
import {preloadSecrets} from '../hooks/useSecrets'
import {type VideoInputProps} from '../types'
import ErrorBoundaryCard from './ErrorBoundaryCard'

console.debug({of, tap})

const InputLoader = lazy(() => import('./InputLoader'))

const EMPTY_ARRAY = []

// This container ensures that no matter if the user is onboarded or not, have a video asset or not, the input takes up the same space and don't cause layout shifts
const RatioBox = styled.div`
  aspect-ratio: 16 / 9;
  position: relative;
  width: 100%;
`

// @TODO: figure out the typing of these
type AssetDocument = any
// type Subscription = any

export interface Props extends VideoInputProps {}

// ref should be forwarded to the input element
function Input(props: Props, ref: ForwardedRef<any>) {
  console.log('Input', {props, ref})
  const {client} = useSource()
  // Small trick to start preloading as soon as we have a client, but only once and before useEffect
  useState(() => preloadSecrets(client))
  // props
  const {schemaType, validation, onChange, readOnly, value, presence} = props
  const {mp4_support = 'none'} = schemaType?.options || {}

  // state
  // Maybe we could subscribe just to _id
  const document = (useFormValue([]) as SanityDocument) ?? null
  const [dialogState, setDialogState] = useDialogState()
  const [, setIsLoading] = useState<boolean | 'secrets'>('secrets')

  const [, setError] = useState(null)
  const [, setConfirmRemove] = useState(false)
  const [assetDocument, setAssetDocument] = useState<AssetDocument>(null)
  const [deleteOnMuxChecked] = useState(false)
  const [deleteAssetDocumentChecked] = useState(true)
  const [, setIsSigned] = useState(true)
  const [, setVideoReadyToPlay] = useState(false)

  // Refactored
  const refactoredAsset = useObservableAsset({reference: value?.asset})
  console.debug({refactoredAsset, value, props, mp4_support, setIsSigned, setVideoReadyToPlay})

  // computed
  // const cssAspectRatio = assetDocument?.data?.aspect_ratio?.split(':')?.join('/') || 'auto'
  // refs
  const pollInterval = useRef(null)
  // const removeVideoButton = useRef()
  // @TODO: remove any
  // const videoPlayer = useRef<typeof Video & any>(null)
  // callbacks

  const handleRemoveVideo = useCallback(() => {
    setIsLoading(true)
    const unsetAsset = () => {
      return new Promise<void>((resolve, reject) => {
        unstable_batchedUpdates(() => {
          setAssetDocument(null)
          setConfirmRemove(false)
          setIsLoading(false)
        })
        // @TODO: this bit used to run inside a setState callback, verify the new flow don't cause race conditions
        if (deleteOnMuxChecked || deleteAssetDocumentChecked) {
          return client
            .patch(document._id)
            .unset(['video'])
            .commit({returnDocuments: false})
            .then(() => {
              if (!assetDocument) {
                return resolve()
              }
              return client
                .delete(assetDocument._id)
                .then(() => {
                  resolve()
                })
                .catch((error) => {
                  reject(error)
                })
            })
        }
        return onChange(PatchEvent.from(unset()))
      })
    }
    return unsetAsset()
      .then(() => {
        if (deleteOnMuxChecked) {
          return deleteAsset(client, assetDocument.assetId).catch((error) => {
            setError(error)
          })
        }
        return true
      })
      .catch((error) => {
        setError(error)
      })
  }, [
    assetDocument,
    onChange,
    deleteOnMuxChecked,
    deleteAssetDocumentChecked,
    client,
    document?._id,
  ])

  const pollMux = useCallback(() => {
    if (!assetDocument) {
      return
    }
    if (pollInterval.current) {
      return
    }
    pollInterval.current = setInterval(() => {
      getAsset(client, assetDocument.assetId)
        .then((response) => {
          const props = response.data

          /*
          response examples:
          // https://c8jibo38.api.sanity.io/v2021-05-17/addons/mux/uploads/ecosystem-v3-plugins-migration-1/83b4a6b6-8590-4075-ae06-40b9c9450d3a?tag=sanity.studio
          {"data":{"timeout":3600,"status":"asset_created","new_asset_settings":{"playback_policies":["public"],"passthrough":"83b4a6b6-8590-4075-ae06-40b9c9450d3a","mp4_support":"standard"},"id":"CQnC4u9aNhr00ecnR89qmC02Our4psJqDg","cors_origin":"http:://localhost:3334","asset_id":"T02CwQ5bvsojXauHWrprIl02vz3jCHAJAD"}}
          // https://c8jibo38.api.sanity.io/v2021-05-17/addons/mux/assets/ecosystem-v3-plugins-migration-1/data/T02CwQ5bvsojXauHWrprIl02vz3jCHAJAD?tag=sanity.studio
          // polling endpoint, first fetch:
          {"data":{"upload_id":"CQnC4u9aNhr00ecnR89qmC02Our4psJqDg","status":"preparing","playback_ids":[{"policy":"public","id":"I68ARX00z3Z19xP9DbR01Q9Rxu7zyOI01Mw"}],"mp4_support":"standard","master_access":"none","id":"T02CwQ5bvsojXauHWrprIl02vz3jCHAJAD","created_at":"1651528487"}}
          // second fetch:
          {"data":{"upload_id":"CQnC4u9aNhr00ecnR89qmC02Our4psJqDg","status":"preparing","playback_ids":[{"policy":"public","id":"I68ARX00z3Z19xP9DbR01Q9Rxu7zyOI01Mw"}],"mp4_support":"standard","master_access":"none","id":"T02CwQ5bvsojXauHWrprIl02vz3jCHAJAD","created_at":"1651528487"}}
          // when it's ready on root, but static_renditions.status=preparing
          {"data":{"upload_id":"CQnC4u9aNhr00ecnR89qmC02Our4psJqDg","tracks":[{"type":"video","max_width":1152,"max_height":2048,"max_frame_rate":30,"id":"3K029Y023aZQdjroULzdT38OXG4Qejq6uW","duration":10.633333},{"type":"audio","max_channels":2,"max_channel_layout":"stereo","id":"Fs33xRBPsr14ks1mU5V01lTnkbHhLGNXOKBXGZCi3zwE","duration":10.666667}],"status":"ready","static_renditions":{"status":"preparing"},"playback_ids":[{"policy":"public","id":"I68ARX00z3Z19xP9DbR01Q9Rxu7zyOI01Mw"}],"passthrough":"83b4a6b6-8590-4075-ae06-40b9c9450d3a","non_standard_input_reasons":{"video_resolution":"2160x3840"},"mp4_support":"standard","max_stored_resolution":"UHD","max_stored_frame_rate":30,"master_access":"none","id":"T02CwQ5bvsojXauHWrprIl02vz3jCHAJAD","duration":10.633333,"created_at":"1651528487","aspect_ratio":"9:16"}}
          // all ready
          {"data":{"upload_id":"CQnC4u9aNhr00ecnR89qmC02Our4psJqDg","tracks":[{"type":"video","max_width":1152,"max_height":2048,"max_frame_rate":30,"id":"3K029Y023aZQdjroULzdT38OXG4Qejq6uW","duration":10.633333},{"type":"audio","max_channels":2,"max_channel_layout":"stereo","id":"Fs33xRBPsr14ks1mU5V01lTnkbHhLGNXOKBXGZCi3zwE","duration":10.666667}],"status":"ready","static_renditions":{"status":"ready","files":[{"width":1080,"name":"high.mp4","height":1920,"filesize":"5732060","ext":"mp4","bitrate":4298904},{"width":540,"name":"medium.mp4","height":960,"filesize":"1865887","ext":"mp4","bitrate":1399368},{"width":360,"name":"low.mp4","height":640,"filesize":"1063940","ext":"mp4","bitrate":797928}]},"playback_ids":[{"policy":"public","id":"I68ARX00z3Z19xP9DbR01Q9Rxu7zyOI01Mw"}],"passthrough":"83b4a6b6-8590-4075-ae06-40b9c9450d3a","non_standard_input_reasons":{"video_resolution":"2160x3840"},"mp4_support":"standard","max_stored_resolution":"UHD","max_stored_frame_rate":30,"master_access":"none","id":"T02CwQ5bvsojXauHWrprIl02vz3jCHAJAD","duration":10.633333,"created_at":"1651528487","aspect_ratio":"9:16"}}

          //*/

          client
            .patch(assetDocument._id)
            .set({
              status: props.status,
              data: props,
            })
            .commit({returnDocuments: false})
        })
        .catch((error) => {
          setError(error)
        })
    }, 2000)
  }, [])
  console.debug({pollMux, handleRemoveVideo})

  // this.setupAssetListener()
  // componentDidMount, handleOnUploadComplete, handleSelectAsset
  // const subscription = useRef<Subscription>(null)
  const [, /* shouldSetupAssetListener */ setShouldSetupAssetListener] = useState(0)
  const setupAssetListener = useCallback(() => setShouldSetupAssetListener((_) => ++_), [])
  const documentPreviewStore = useDocumentPreviewStore()
  console.debug({documentPreviewStore})

  useEffect(() => {
    /*
    if (shouldSetupAssetListener) {
      if (subscription.current) {
        subscription.current.unsubscribe()
      }
      setVideoReadyToPlay(false)
      const asset = value?.asset
      if (!asset) {
        return
      }
      subscription.current = documentPreviewStore
        .observePaths(asset, ['thumbTime', 'data', 'assetId', 'playbackId', 'status'])
        .pipe(
          tap((assetDocument: AssetDocument) => {
            setAssetDocument(assetDocument)
            if (assetDocument && assetDocument.status === 'errored') {
              clearInterval(pollInterval.current)
              pollInterval.current = null
              // eslint-disable-next-line no-warning-comments
              // todo: use client.observable
              return handleRemoveVideo().then(() => {
                unstable_batchedUpdates(() => {
                  setIsLoading(false)
                  setError(new Error(assetDocument.data.errors.messages.join(' ')))
                })
              })
            }
            // Poll MUX if it's preparing the main document or its own static renditions
            if (
              assetDocument?.status === 'preparing' ||
              assetDocument?.data?.static_renditions?.status === 'preparing'
            ) {
              pollMux()
            }
            // If MP4 support is enabled: MUX will prepare static_renditions only _after_ an asset
            // has been successfully uploaded.
            // A _ready_ asset doesn't mean static mp4s are generated and ready for use!
            // In these cases, wait for `static_renditions.status === 'ready'` before clearing the poll interval.
            if (assetDocument && assetDocument.status === 'ready') {
              switch (mp4_support) {
                case 'standard':
                  if (assetDocument?.data?.static_renditions?.status === 'ready') {
                    clearInterval(pollInterval.current)
                    pollInterval.current = null
                  }
                  break
                // case 'none':
                default:
                  clearInterval(pollInterval.current)
                  pollInterval.current = null
                  break
              }
            }

            // eslint-disable-next-line camelcase
            const isSigned = assetDocument?.data?.playback_ids[0]?.policy === 'signed'
            unstable_batchedUpdates(() => {
              setAssetDocument(assetDocument)
              setIsSigned(isSigned)
              setIsLoading(false)
            })

            return of(assetDocument)
          })
        )
        .subscribe()

      // componentWillUnmount
      return () => {
        if (subscription.current) {
          subscription.current.unsubscribe()
        }
        if (pollInterval.current) {
          clearInterval(pollInterval.current)
          pollInterval.current = null
        }
      }
    }

    // */
  }, [])

  // componentDidMount
  useEffect(() => {
    console.debug('componentDidMount', props)
    setupAssetListener()
  }, [])

  console.log(schemaType.title, schemaType.description, ref)

  return (
    <>
      <RatioBox>
        <ErrorBoundaryCard schemaType={schemaType}>
          <Suspense
            fallback={
              <div style={{padding: 1}}>
                <Card
                  shadow={1}
                  sizing="border"
                  style={{aspectRatio: '16/9', width: '100%', borderRadius: '1px'}}
                >
                  <Flex align="center" direction="column" height="fill" justify="center">
                    <Spinner muted />
                    <Box marginTop={3}>
                      <Text align="center" muted size={1}>
                        Loading…
                      </Text>
                    </Box>
                  </Flex>
                </Card>
              </div>
            }
          >
            <InputLoader
              setDialogState={setDialogState}
              dialogState={dialogState}
              readOnly={readOnly}
              onChange={onChange}
              value={value}
              schemaType={schemaType}
            />
          </Suspense>
        </ErrorBoundaryCard>
      </RatioBox>
    </>
  )
}

/*

const handleCancelRemove = useCallback(() => {
    unstable_batchedUpdates(() => {
      setConfirmRemove(false)
      setDeleteOnMuxChecked(true)
      setDeleteAssetDocumentChecked(true)
    })
  }, [])
  const handleDeleteOnMuxCheckBoxClicked = useCallback(() => {
    setDeleteOnMuxChecked((deleteOnMuxChecked) => !deleteOnMuxChecked)
  }, [])
  const handleDeleteAssetDocumentCheckBoxClicked = useCallback(() => {
    setDeleteAssetDocumentChecked((deleteAssetDocumentChecked) => !deleteAssetDocumentChecked)
  }, [])
  const handleOpenThumb = useCallback(() => {
    if (!videoPlayer.current) {
      return
    }
    const currentTime = videoPlayer.current.getVideoElement().currentTime
    const options = {
      time: assetDocument.thumbTime,
      width: 320,
      height: 320,
      fit_mode: 'crop' as const,
      isSigned,
      signingKeyId: cachedSecrets.signingKeyId,
      signingKeyPrivate: cachedSecrets.signingKeyPrivate,
    }

    const thumb = getPosterSrc(assetDocument.playbackId, options)
    const newThumb = getPosterSrc(assetDocument.playbackId, {...options, time: currentTime})

    unstable_batchedUpdates(() => {
      setThumb(thumb)
      setNewThumb(newThumb)
    })
  }, [assetDocument, isSigned, getPosterSrc])
  const handleSetThumbButton = useCallback(() => {
    if (!videoPlayer.current) {
      return
    }

    setThumbLoading(true)
    const currentTime = videoPlayer.current.getVideoElement().currentTime
    client
      .patch(assetDocument._id)
      .set({
        thumbTime: currentTime,
      })
      .commit({returnDocuments: false})
      .then(async (response) => {
        console.log({response})
        const options = {
          time: currentTime,
          width: 320,
          height: 320,
          fit_mode: 'crop' as const,
          isSigned,
          signingKeyId: cachedSecrets.signingKeyId,
          signingKeyPrivate: cachedSecrets.signingKeyPrivate,
        }

        const thumb = getPosterSrc(assetDocument.playbackId, options)

        unstable_batchedUpdates(() => {
          setThumb(thumb)
          setThumbLoading(false)
        })
      })
      .catch((error) => {
        unstable_batchedUpdates(() => {
          setError(error)
          setThumbLoading(false)
        })
      })
  }, [assetDocument, isSigned, client])

const handleFocus = useCallback(() => {
    setHasFocus(true)
  }, [])
  const handleBlur = useCallback(() => {
    setHasFocus(false)
  }, [])
  const handleSetupButtonClicked = useCallback(() => {}, [])
  const handleOnUploadComplete = useCallback(
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
  )
  const handleRemoveVideoButtonClicked = useCallback((event: any) => {
    event.preventDefault()
    event.stopPropagation()
    setConfirmRemove(true)
  }, [])


const handleCloseThumbPreview = useCallback(() => {
    setThumb(null)
  }, [])
  const handleBrowseButton = useCallback(() => {
    setDialogState('select-video')
  }, [setDialogState])
  const handleVideoReadyToPlay = useCallback(() => {
    setVideoReadyToPlay(true)
  }, [])


<FormField
        style={{display: 'none'}}
        level={level}
        title={type.title}
        description={type.description}
        className={styles.formField}
        __unstable_changeIndicator
        __unstable_presence={presence}
      >
        <Text color="var(--card-muted-fg-color, #a4acb8)">
          <VideoIcon />
        </Text>
        <br />
        <Box style={{position: 'relative'}}>
          <Uploader
            client={client}
            buttons={
              <VideoButtons
                assetDocument={assetDocument}
                confirmRemove={confirmRemove}
                readOnly={readOnly}
                handleBrowseButton={handleBrowseButton}
                videoReadyToPlay={videoReadyToPlay}
                handleOpenThumb={handleOpenThumb}
                removeVideoButton={removeVideoButton}
                handleRemoveVideoButtonClicked={handleRemoveVideoButtonClicked}
              />
            }
            hasFocus={hasFocus}
            onBlur={handleBlur}
            onFocus={handleFocus}
            onSetupButtonClicked={handleSetupButtonClicked}
            onUploadComplete={handleOnUploadComplete}
            secrets={secrets}
            onBrowse={handleBrowseButton}
          >
            <Asset
              assetDocument={assetDocument}
              isSigned={isSigned}
              videoPlayer={videoPlayer}
              handleVideoReadyToPlay={handleVideoReadyToPlay}
              handleRemoveVideo={handleRemoveVideo}
            />
          </Uploader>

          {thumb && (
            <Dialog
              id="mux-thumb"
              header="Thumbnail"
              zOffset={1000}
              onClose={handleCloseThumbPreview}
            >
              <Stack space={3} padding={3}>
                <Stack space={3}>
                  <Stack space={2}>
                    <Text size={1} weight="semibold">
                      Current:
                    </Text>
                    <img
                      style={{
                        maxWidth: '100%',
                        borderRadius: '0.1875rem',
                        display: 'block',
                        aspectRatio: cssAspectRatio,
                      }}
                      src={thumb}
                      width={400}
                    />
                  </Stack>
                  <Stack space={2}>
                    <Text size={1} weight="semibold">
                      New:
                    </Text>
                    <img
                      style={{
                        maxWidth: '100%',
                        borderRadius: '0.1875rem',
                        display: 'block',
                        aspectRatio: cssAspectRatio,
                      }}
                      src={newThumb}
                      alt=""
                      width={400}
                    />
                  </Stack>
                </Stack>
                <Button
                  key="thumbnail"
                  mode="ghost"
                  tone="primary"
                  disabled={videoReadyToPlay === false}
                  onClick={handleSetThumbButton}
                  loading={thumbLoading}
                  text="Set new thumbnail"
                />
              </Stack>
            </Dialog>
          )}

          {confirmRemove && (
            <Dialog
              id="mux-confirm-remove"
              header="Remove video"
              zOffset={1000}
              onClose={handleCancelRemove}
            >
              <Box padding={4}>
                <Stack space={3}>
                  <Flex align="center">
                    <Checkbox
                      checked={deleteOnMuxChecked}
                      onChange={handleDeleteOnMuxCheckBoxClicked}
                    />
                    <Text style={{margin: '0 10px'}}>Delete asset on Mux</Text>
                  </Flex>
                  <Flex align="center">
                    <Checkbox
                      disabled={deleteOnMuxChecked}
                      checked={deleteOnMuxChecked || deleteAssetDocumentChecked}
                      onChange={handleDeleteAssetDocumentCheckBoxClicked}
                    />
                    <Text style={{margin: '0 10px'}}>Delete video from dataset</Text>
                  </Flex>
                  <Grid columns={2} gap={2}>
                    <Button
                      mode="ghost"
                      tone="default"
                      text="Cancel"
                      onClick={handleCancelRemove}
                      loading={!!isLoading}
                    />
                    <Button
                      mode="default"
                      tone="critical"
                      text="Remove"
                      onClick={handleRemoveVideo}
                      loading={!!isLoading}
                    />
                  </Grid>
                </Stack>
              </Box>
            </Dialog>
          )}
        </Box>
      </FormField>


function VideoButtons(props) {
  const {
    assetDocument,
    confirmRemove,
    readOnly,
    handleBrowseButton,
    videoReadyToPlay,
    handleOpenThumb,
    removeVideoButton,
    handleRemoveVideoButtonClicked,
  } = props
  console.log({assetDocument})
  if (assetDocument && assetDocument.status === 'ready' && !readOnly) {
    return (
      <>
        <Button
          key="browse"
          mode="ghost"
          tone="primary"
          onClick={handleBrowseButton}
          text="Browse"
        />
        <Button
          key="thumbnail"
          mode="ghost"
          tone="primary"
          disabled={videoReadyToPlay === false}
          onClick={handleOpenThumb}
          text="Thumbnail"
        />
        <Button
          key="remove"
          ref={removeVideoButton}
          onClick={confirmRemove ? undefined : handleRemoveVideoButtonClicked}
          mode="ghost"
          tone="critical"
          text="Remove"
        />
      </>
    )
  }
  return null
}

function Asset(props) {
  const {client} = useSource()
  const {assetDocument, isSigned, videoPlayer, handleVideoReadyToPlay, handleRemoveVideo} = props
  const renderAsset = !!assetDocument
  if (!renderAsset) {
    return null
  }
  const isSignedAlert = isSigned ? (
    <Card padding={3} radius={2} shadow={1} tone="positive">
      <Text size={1}>This Mux asset is using a signed url.</Text>
    </Card>
  ) : null
  return (
    <Stack space={2} marginBottom={2}>
      {isSignedAlert}
      <Video
        client={client}
        assetDocument={assetDocument}
        ref={videoPlayer}
        onReady={handleVideoReadyToPlay}
        onCancel={handleRemoveVideo}
      />
    </Stack>
  )
}

// */

function hasDocument(document?: any): document is SanityDocument {
  return !!document
}

export default memo(forwardRef(Input))
