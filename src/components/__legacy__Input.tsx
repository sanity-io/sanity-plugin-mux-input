// This component needs to be refactored into a functional component

import type {SanityClient} from '@sanity/client'
import {Box, Button, Checkbox, Dialog, Flex, Grid, Inline, Spinner, Stack, Text} from '@sanity/ui'
import React, {Component} from 'react'
import {of} from 'rxjs'
import {tap} from 'rxjs/operators'
import type {ObservePathsFn} from 'sanity/_unstable'
import {PatchEvent, set, setIfMissing, unset} from 'sanity/form'

import {deleteAsset, getAsset} from '../actions/assets'
import type {Config, MuxInputProps, Secrets, VideoAssetDocument} from '../util/types'
import Uploader from './__legacy__Uploader'
import InputBrowser from './InputBrowser'
import InputError from './InputError'
import SetupButton from './SetupButton'
import SetupNotice from './SetupNotice'

interface Props extends MuxInputProps {
  asset: VideoAssetDocument | null | undefined
  config: Config
  client: SanityClient
  secrets: Secrets
  needsSetup: boolean
  isInitialSetup: boolean
  observePaths: ObservePathsFn
}

interface State {
  assetDocument: VideoAssetDocument | null
  confirmRemove: boolean
  deleteOnMuxChecked: boolean
  deleteAssetDocumentChecked: boolean
  error: Error | null
  hasFocus: boolean
  isLoading: boolean | 'secrets'
  showSetup: boolean
  showBrowser: boolean
}

export default class MuxVideoInput extends Component<Props, State> {
  state: State = {
    assetDocument: null,
    confirmRemove: false,
    deleteOnMuxChecked: false,
    deleteAssetDocumentChecked: true,
    error: null,
    hasFocus: false,
    isLoading: 'secrets',
    showSetup: false,
    showBrowser: false,
  }

  // eslint-disable-next-line no-warning-comments
  // @TODO setup proper Observable typings
  subscription?: any

  componentDidMount() {
    this.setState({
      // If there is an asset continue loading
      isLoading: !!this.props.value?.asset,
    })
    this.setupAssetListener()
  }

  componentWillUnmount() {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
  }

  handleFocus = () => {
    this.setState({hasFocus: true})
  }

  handleBlur = () => {
    this.setState({hasFocus: false})
  }

  setupAssetListener() {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
    const asset = this.props.value?.asset
    if (!asset) {
      return
    }
    this.subscription = this.props
      .observePaths(asset, ['thumbTime', 'data', 'assetId', 'playbackId', 'status'])
      .pipe(
        // eslint-disable-next-line no-warning-comments
        // @ts-expect-error -- @TODO need to refactor this logic and use react-rx useMemoObservable
        tap((assetDocument: VideoAssetDocument) => {
          this.setState({assetDocument})
          if (assetDocument && assetDocument.status === 'errored') {
            // eslint-disable-next-line no-warning-comments
            // todo: use client.observable
            return this.handleRemoveVideo().then(() => {
              this.setState({
                isLoading: false,
                error: new Error(assetDocument.data?.errors?.messages?.join(' ')),
              })
            })
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

  handleSetupButtonClicked = () => {
    this.setState((prevState) => ({showSetup: !prevState.showSetup}))
  }

  handleSaveSetup = () => {
    this.setState({
      showSetup: false,
    })
  }

  handleCancelSaveSetup = () => {
    this.setState({showSetup: false})
  }

  handleOnUploadComplete = (result: VideoAssetDocument) => {
    const {onChange} = this.props
    const {_id} = result
    onChange(
      PatchEvent.from([setIfMissing({asset: {}}), set({_type: 'reference', _ref: _id}, ['asset'])])
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
            // @TODO implement the delete modal in the asset selector menu instead
            if (false) {
              return this.props.client
                .patch(this.props.document._id)
                .unset(['video'])
                .commit({returnDocuments: false})
                .then(() => {
                  if (!assetDocument) {
                    return resolve(undefined)
                  }
                  return this.props.client
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
          return deleteAsset(this.props.client, assetDocument!.assetId!).catch((error) => {
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

  render() {
    return (
      <>
        <Box style={{position: 'relative'}}>
          <Flex align="center" justify="space-between">
            <SetupButton
              isLoading={this.state.isLoading}
              needsSetup={this.props.needsSetup}
              onClose={this.handleCancelSaveSetup}
              onSave={this.handleSaveSetup}
              onSetup={this.handleSetupButtonClicked}
              showSetup={this.state.showSetup}
              secrets={this.props.secrets}
            />
          </Flex>
          {this.state.isLoading === 'secrets' && (
            <Box marginBottom={2}>
              <Inline space={2}>
                <Spinner muted />
                <Text size={1}>Fetching credentials</Text>
              </Inline>
            </Box>
          )}

          {this.props.needsSetup && (
            <SetupNotice
              isLoading={this.state.isLoading}
              isInitialSetup={this.props.isInitialSetup}
            />
          )}

          {!this.props.needsSetup && this.props.secrets && (
            <Uploader
              config={this.props.config}
              client={this.props.client}
              hasFocus={this.state.hasFocus}
              onBlur={this.handleBlur}
              onFocus={this.handleFocus}
              onSetupButtonClicked={this.handleSetupButtonClicked}
              onUploadComplete={this.handleOnUploadComplete}
              secrets={this.props.secrets}
              onBrowse={this.handleBrowseButton}
              asset={this.props.asset}
              onRemove={this.handleRemoveVideoButtonClicked}
              readOnly={this.props.readOnly}
              handleRemoveVideo={this.handleRemoveVideo}
            />
          )}

          {this.state.showBrowser && (
            <InputBrowser onClose={this.handleCloseBrowser} onSelect={this.handleSelectAsset} />
          )}

          {this.state.confirmRemove && (
            <Dialog
              id="remove-video"
              header="Remove video"
              zOffset={1000}
              onClose={this.handleCancelRemove}
            >
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
