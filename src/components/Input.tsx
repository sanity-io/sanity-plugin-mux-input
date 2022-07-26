import type {SanityDocument} from "@sanity/types"
import {Box, Button, Card, Checkbox, Dialog, Flex, Grid, Inline, Stack, Text} from '@sanity/ui'
import {observePaths} from 'part:@sanity/base/preview'
import FormField from 'part:@sanity/components/formfields/default'
import Spinner from 'part:@sanity/components/loading/spinner'
import {withDocument} from 'part:@sanity/form-builder'
import PatchEvent, {set, setIfMissing, unset} from 'part:@sanity/form-builder/patch-event'
import React, {Component} from 'react'
import {of} from 'rxjs'
import {tap} from 'rxjs/operators'

import {deleteAsset, getAsset} from '../actions/assets'
import {fetchSecrets} from '../actions/secrets'
import client from '../clients/SanityClient'
import config from '../config'
import {getPosterSrc} from '../util/getPosterSrc'
import type {Secrets, VideoAssetDocument} from '../util/types'
import styles from './Input.css'
import InputBrowser from './InputBrowser'
import InputError from './InputError'
import Player from './Player'
import SetupButton from './SetupButton'
import SetupNotice from './SetupNotice'
import Uploader from './Uploader'

const cachedSecrets: Secrets = {
  token: null,
  secretKey: null,
  enableSignedUrls: false,
  signingKeyId: null,
  signingKeyPrivate: null,
}

function validateSecrets(secrets: Secrets) {
  if (!secrets.token || !secrets.secretKey) return false

  return true
}

function getSecrets() {
  if (cachedSecrets.token) {
    return Promise.resolve({
      isInitialSetup: true,
      needsSetup: false,
      secrets: cachedSecrets,
    })
  }
  return fetchSecrets().then(({secrets, exists}) => {
    cachedSecrets.token = secrets?.token ?? null
    cachedSecrets.secretKey = secrets?.secretKey ?? null
    cachedSecrets.enableSignedUrls = secrets?.enableSignedUrls ?? false
    cachedSecrets.signingKeyId = secrets?.signingKeyId ?? null
    cachedSecrets.signingKeyPrivate = secrets?.signingKeyPrivate ?? null

    return {
      isInitialSetup: !exists,
      needsSetup: !validateSecrets(cachedSecrets),
      secrets: cachedSecrets,
    }
  })
}

interface Props {
  document: SanityDocument
  value?: null | {asset?: {_type: "reference", _ref: string}}
}

interface State {}

export default withDocument(
  class MuxVideoInput extends Component<Props, State> {
    state: State = {
      assetDocument: null,
      confirmRemove: false,
      deleteOnMuxChecked: false,
      deleteAssetDocumentChecked: true,
      error: null,
      hasFocus: false,
      isInitialSetup: true,
      isLoading: 'secrets',
      needsSetup: true,
      secrets: null,
      isSigned: false,
      showSetup: false,
      showBrowser: false,
      videoReadyToPlay: false,
      thumbLoading: false,
    }

    setupButton = React.createRef<HTMLButtonElement>()
    pollInterval?: number
    video = React.createRef<HTMLVideoElement>()
    removeVideoButton = React.createRef<HTMLButtonElement>()
    videoPlayer = React.createRef<HTMLDivElement>()
    // @TODO setup proper Observable typings
    subscription?: any

    componentDidMount() {
      getSecrets()
        .then(({secrets, isInitialSetup, needsSetup}) => {
          this.setState({
            secrets,
            isInitialSetup,
            needsSetup,
            isLoading: this.props.value?.asset, // If there is an asset continue loading
          })
        })
        .catch((error) => this.setState({error}))
      this.setupAssetListener()
    }

    componentWillUnmount() {
      if (this.subscription) {
        this.subscription.unsubscribe()
      }
      if (this.pollInterval) {
        clearInterval(this.pollInterval)
        this.pollInterval = undefined
      }
    }

    handleFocus = () => {
      this.setState({hasFocus: true})
    }

    handleBlur = () => {
      this.setState({hasFocus: false})
    }

    getAsset() {
      const {value} = this.props
      return value ? value.asset : null
    }

    setupAssetListener() {
      if (this.subscription) {
        this.subscription.unsubscribe()
      }
      this.setState({videoReadyToPlay: false})
      const asset = this.getAsset()
      if (!asset) {
        return
      }
      this.subscription = observePaths(asset, [
        'thumbTime',
        'data',
        'assetId',
        'playbackId',
        'status',
      ])
        .pipe(
          tap((assetDocument: VideoAssetDocument) => {
            this.setState({assetDocument})
            if (assetDocument && assetDocument.status === 'errored') {
              clearInterval(this.pollInterval)
              this.pollInterval = undefined
              // eslint-disable-next-line no-warning-comments
              // todo: use client.observable
              return this.handleRemoveVideo().then(() => {
                this.setState({
                  isLoading: false,
                  error: new Error(assetDocument.data?.errors?.messages?.join(' ')),
                })
              })
            }
            // Poll MUX if it's preparing the main document or its own static renditions
            if (
              assetDocument?.status === 'preparing' ||
              assetDocument?.data?.static_renditions?.status === 'preparing'
            ) {
              this.pollMux()
            }
            // If MP4 support is enabled: MUX will prepare static_renditions only _after_ an asset
            // has been successfully uploaded.
            // A _ready_ asset doesn't mean static mp4s are generated and ready for use!
            // In these cases, wait for `static_renditions.status === 'ready'` before clearing the poll interval.
            if (assetDocument && assetDocument.status === 'ready') {
              switch (config.mp4_support) {
                case 'standard':
                  if (assetDocument?.data?.static_renditions?.status === 'ready') {
                    clearInterval(this.pollInterval)
                    this.pollInterval = undefined
                  }
                  break
                case 'none':
                default:
                  clearInterval(this.pollInterval)
                  this.pollInterval = undefined
                  break
              }
            }

            // eslint-disable-next-line camelcase
            const isSigned = assetDocument?.data?.playback_ids?.[0]?.policy === 'signed'
            this.setState({assetDocument, isSigned, isLoading: false})

            return of(assetDocument)
          })
        )
        .subscribe()
    }

    pollMux = () => {
      const assetDocument = this.state.assetDocument
      if (!assetDocument) {
        return
      }
      if (this.pollInterval) {
        return
      }
      this.pollInterval = (setInterval as typeof window.setInterval)(() => {
        getAsset(assetDocument.assetId)
          .then((response) => {
            const props = response.data

            client
              .patch(assetDocument._id)
              .set({
                status: props.status,
                data: props,
              })
              .commit({returnDocuments: false})
          })
          .catch((error) => {
            this.setState({error})
          })
      }, 2000)
    }

    handleSetupButtonClicked = () => {
      this.setState((prevState) => ({showSetup: !prevState.showStetup}))
    }

    handleSaveSetup = ({token, secretKey, enableSignedUrls, signingKeyId, signingKeyPrivate}) => {
      cachedSecrets.token = token
      cachedSecrets.secretKey = secretKey
      cachedSecrets.enableSignedUrls = enableSignedUrls
      cachedSecrets.signingKeyId = signingKeyId
      cachedSecrets.signingKeyPrivate = signingKeyPrivate

      this.setState({
        showSetup: false,
        secrets: cachedSecrets,
        needsSetup: !validateSecrets(cachedSecrets),
      })
    }

    handleCancelSaveSetup = () => {
      this.setState({showSetup: false})
    }

    handleOnUploadComplete = (result) => {
      const {onChange} = this.props
      const {_id} = result
      onChange(
        PatchEvent.from([
          setIfMissing({asset: {}}),
          set({_type: 'reference', _ref: _id}, ['asset']),
        ])
      )
      this.setState({assetDocument: result.document}, () => {
        this.setupAssetListener()
      })
    }

    handleRemoveVideoButtonClicked = (event) => {
      event.preventDefault()
      event.stopPropagation()
      this.setState({confirmRemove: true})
    }

    handleRemoveVideo = () => {
      const {assetDocument} = this.state
      this.setState({isLoading: true})
      const unsetAsset = () => {
        return new Promise<void>((resolve, reject) => {
          this.setState(
            {
              assetDocument: null,
              confirmRemove: false,
              isLoading: false,
            },
            () => {
              if (this.state.deleteOnMuxChecked || this.state.deleteAssetDocumentChecked) {
                return client
                  .patch(this.props.document._id)
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
              return this.props.onChange(PatchEvent.from(unset()))
            }
          )
        })
      }
      return unsetAsset()
        .then(() => {
          if (this.state.deleteOnMuxChecked) {
            return deleteAsset(assetDocument.assetId).catch((error) => {
              this.setState({error})
            })
          }
          return true
        })
        .catch((error) => {
          this.setState({error})
        })
    }

    handleCancelRemove = () => {
      this.setState({
        confirmRemove: false,
        deleteOnMuxChecked: true,
        deleteAssetDocumentChecked: true,
      })
    }

    handleDeleteOnMuxCheckBoxClicked = () => {
      this.setState((prevState) => ({
        deleteOnMuxChecked: !prevState.deleteOnMuxChecked,
      }))
    }

    handleDeleteAssetDocumentCheckBoxClicked = () => {
      this.setState((prevState) => ({
        deleteAssetDocumentChecked: !prevState.deleteAssetDocumentChecked,
      }))
    }

    handleOpenThumb = () => {
      if (!this.videoPlayer.current) {
        return
      }
      const {assetDocument, isSigned} = this.state
      const currentTime = this.videoPlayer.current.getVideoElement().currentTime
      const options = {
        time: assetDocument.thumbTime,
        width: 320,
        height: 320,
        fitMode: 'crop',
        isSigned,
        signingKeyId: cachedSecrets.signingKeyId,
        signingKeyPrivate: cachedSecrets.signingKeyPrivate,
      }

      const thumb = getPosterSrc({
        asset: assetDocument,
        width: 320,
        height: 320,
        fitMode: 'crop',
        secrets: cachedSecrets,
      })
      const newThumb = getPosterSrc(assetDocument.playbackId, {...options, time: currentTime})

      this.setState({thumb, newThumb})
    }

    handleSetThumbButton = () => {
      if (!this.videoPlayer.current) {
        return
      }

      this.setState({thumbLoading: true})
      const {assetDocument, isSigned} = this.state
      const currentTime = this.videoPlayer.current.getVideoElement().currentTime
      client
        .patch(assetDocument._id)
        .set({
          thumbTime: currentTime,
        })
        .commit({returnDocuments: false})
        .then(() => {
          const options = {
            time: currentTime,
            width: 320,
            height: 320,
            fitMode: 'crop',
            isSigned,
            signingKeyId: cachedSecrets.signingKeyId,
            signingKeyPrivate: cachedSecrets.signingKeyPrivate,
          }

          const thumb = getPosterSrc({
            asset: assetDocument.playbackId,
            time: currentTime,
            width: 320,
            height: 320,
            fitMode: 'crop',
            secrets: cachedSecrets,
          })

          this.setState({thumb, thumbLoading: false})
        })
        .catch((error) => {
          this.setState({error, thumbLoading: false})
        })
    }

    handleErrorClose = () => {
      this.setState({
        error: null,
      })
    }

    handleCloseThumbPreview = () => {
      this.setState({thumb: null})
    }

    handleBrowseButton = () => {
      this.setState({showBrowser: true})
    }

    handleCloseBrowser = () => {
      this.setState({showBrowser: false})
    }

    handleSelectAsset = (asset) => {
      const {onChange} = this.props

      onChange(
        PatchEvent.from([
          setIfMissing({asset: {}}),
          set({_type: 'reference', _ref: asset._id}, ['asset']),
        ])
      )

      this.setState({showBrowser: false, assetDocument: asset}, () => {
        this.setupAssetListener()
      })
    }

    handleVideoReadyToPlay = () => {
      this.setState({videoReadyToPlay: true})
    }

    // eslint-disable-next-line complexity
    renderAsset() {
      const {assetDocument, isSigned} = this.state
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
          <Player
            asset={assetDocument}
            ref={this.videoPlayer}
            onReady={this.handleVideoReadyToPlay}
            onCancel={this.handleRemoveVideo}
          />
        </Stack>
      )
    }


    render() {
      const {type, level, markers} = this.props

      const cssAspectRatio =
        this.state.assetDocument?.data?.aspect_ratio?.split(':')?.join('/') || 'auto'

      return (
        <>
          <Box style={{position: 'relative'}}>
            <Flex align="center" justify="space-between">
              <FormField
                label={type.title}
                markers={markers}
                description={type.description}
                level={level}
                className={styles.formField}
              />
              <SetupButton
                isLoading={this.state.isLoading}
                needsSetup={this.state.needsSetup}
                onCancel={this.handleCancelSaveSetup}
                onSave={this.handleSaveSetup}
                onSetup={this.handleSetupButtonClicked}
                secrets={this.state.secrets}
                showSetup={this.state.showSetup}
              />
            </Flex>
            {this.state.isLoading === 'secrets' && (
              <Box marginBottom={2}>
                <Inline align="center" space={2}>
                  <Spinner inline />
                  <Text size={1}>Fetching credentials</Text>
                </Inline>
              </Box>
            )}

            {this.state.needsSetup && (
              <SetupNotice
                isLoading={this.state.isLoading}
                isInitialSetup={this.state.isInitialSetup}
              />
            )}

            {!this.state.needsSetup && this.state.secrets && (
              <Uploader
                hasFocus={this.state.hasFocus}
                onBlur={this.handleBlur}
                onFocus={this.handleFocus}
                onSetupButtonClicked={this.handleSetupButtonClicked}
                onUploadComplete={this.handleOnUploadComplete}
                secrets={this.state.secrets}
                onBrowse={this.handleBrowseButton}
                asset={this.state.assetDocument}
              >
                {this.renderAsset()}
              </Uploader>
            )}

            {this.state.thumb && (
              <Dialog header="Thumbnail" zOffset={1000} onClose={this.handleCloseThumbPreview}>
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
                        src={this.state.thumb}
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
                        src={this.state.newThumb}
                        width={400}
                      />
                    </Stack>
                  </Stack>
                  <Button
                    key="thumbnail"
                    mode="ghost"
                    tone="primary"
                    disabled={this.state.videoReadyToPlay === false}
                    onClick={this.handleSetThumbButton}
                    loading={this.state.thumbLoading}
                    text="Set new thumbnail"
                  />
                </Stack>
              </Dialog>
            )}

            {this.state.showBrowser && (
              <InputBrowser
                onClose={this.handleCloseBrowser}
                onSelect={this.handleSelectAsset}
                secrets={this.state.secrets!}
              />
            )}

            {this.state.confirmRemove && (
              <Dialog header="Remove video" zOffset={1000} onClose={this.handleCancelRemove}>
                <Box padding={4}>
                  <Stack space={3}>
                    <Flex align="center">
                      <Checkbox
                        checked={this.state.deleteOnMuxChecked}
                        onChange={this.handleDeleteOnMuxCheckBoxClicked}
                      />
                      <Text style={{margin: '0 10px'}}>Delete asset on Mux</Text>
                    </Flex>
                    <Flex align="center">
                      <Checkbox
                        disabled={this.state.deleteOnMuxChecked}
                        checked={
                          this.state.deleteOnMuxChecked || this.state.deleteAssetDocumentChecked
                        }
                        onChange={this.handleDeleteAssetDocumentCheckBoxClicked}
                      />
                      <Text style={{margin: '0 10px'}}>Delete video from dataset</Text>
                    </Flex>
                    <Grid columns={2} gap={2}>
                      <Button
                        mode="ghost"
                        tone="default"
                        text="Cancel"
                        onClick={this.handleCancelRemove}
                        loading={!!this.state.isLoading}
                      />
                      <Button
                        mode="default"
                        tone="critical"
                        text="Remove"
                        onClick={this.handleRemoveVideo}
                        loading={!!this.state.isLoading}
                      />
                    </Grid>
                  </Stack>
                </Box>
              </Dialog>
            )}

            {this.state.error && (
              <InputError error={this.state.error} onClose={this.handleErrorClose} />
            )}
          </Box>
        </>
      )
    }
  }
)
