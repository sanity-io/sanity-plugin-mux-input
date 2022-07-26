import type {SanityDocument} from '@sanity/types'
import {Box, Button, Checkbox, Dialog, Flex, Grid, Inline, Stack, Text} from '@sanity/ui'
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
import type {Secrets, VideoAssetDocument} from '../util/types'
import styles from './Input.css'
import InputBrowser from './InputBrowser'
import InputError from './InputError'
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

function getSecrets(): Promise<{isInitialSetup: boolean; needsSetup: boolean; secrets: Secrets}> {
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
  value?: null | {asset?: {_type: 'reference'; _ref: string}}
  type: any
  level: any
  markers: any
  onChange: any
  readOnly: boolean
}

interface State {
  assetDocument: VideoAssetDocument | null
  confirmRemove: boolean
  deleteOnMuxChecked: boolean
  deleteAssetDocumentChecked: boolean
  error: Error | null
  hasFocus: boolean
  isInitialSetup: boolean
  isLoading: boolean | 'secrets'
  needsSetup: boolean
  secrets: Secrets | null
  showSetup: boolean
  showBrowser: boolean
  videoReadyToPlay: boolean
}

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
      showSetup: false,
      showBrowser: false,
      videoReadyToPlay: false,
    }

    pollInterval?: number
    // eslint-disable-next-line no-warning-comments
    // @TODO setup proper Observable typings
    subscription?: any

    componentDidMount() {
      getSecrets()
        .then(({secrets, isInitialSetup, needsSetup}) => {
          this.setState({
            secrets,
            isInitialSetup,
            needsSetup,
            // If there is an asset continue loading
            isLoading: !!this.props.value?.asset,
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

            this.setState({
              assetDocument,
              isLoading: false,
            })

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
        getAsset(assetDocument.assetId!)
          .then((response) => {
            const props = response.data

            client
              .patch(assetDocument._id!)
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
      this.setState((prevState) => ({showSetup: !prevState.showSetup}))
    }

    handleSaveSetup = ({
      token,
      secretKey,
      enableSignedUrls,
      signingKeyId,
      signingKeyPrivate,
    }: Secrets) => {
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

    handleOnUploadComplete = (result: any) => {
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

    handleRemoveVideoButtonClicked = () => {
      this.setState({confirmRemove: true})
    }

    handleRemoveVideo = () => {
      const {assetDocument} = this.state
      this.setState({isLoading: true})
      const unsetAsset = () => {
        return new Promise<any>((resolve, reject) => {
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
                      return resolve(undefined)
                    }
                    return client
                      .delete(assetDocument._id!)
                      .then(() => {
                        resolve(undefined)
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
            return deleteAsset(assetDocument!.assetId!).catch((error) => {
              this.setState({error})
            })
          }
          return true as any
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

    handleErrorClose = () => {
      this.setState({
        error: null,
      })
    }

    handleBrowseButton = () => {
      this.setState({showBrowser: true})
    }

    handleCloseBrowser = () => {
      this.setState({showBrowser: false})
    }

    handleSelectAsset = (asset: VideoAssetDocument) => {
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

    render() {
      const {type, level, markers} = this.props

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
                <Inline space={2}>
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
                asset={this.state.assetDocument!}
                onRemove={this.handleRemoveVideoButtonClicked}
                readOnly={this.props.readOnly}
                handleVideoReadyToPlay={this.handleVideoReadyToPlay}
                videoReadyToPlay={this.state.videoReadyToPlay}
                handleRemoveVideo={this.handleRemoveVideo}
              />
            )}

            {this.state.showBrowser && (
              <InputBrowser
                onClose={this.handleCloseBrowser}
                onSelect={this.handleSelectAsset}
                secrets={this.state.secrets!}
              />
            )}

            {this.state.confirmRemove && (
              <Dialog id="remove-video" header="Remove video" zOffset={1000} onClose={this.handleCancelRemove}>
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
