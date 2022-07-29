// This component needs to be refactored into a functional component

import type {SanityClient} from '@sanity/client'
import {Box, Button, Checkbox, Dialog, Flex, Grid, Stack, Text} from '@sanity/ui'
import React, {Component} from 'react'

import type {DialogState, SetDialogState} from '../hooks/useDialogState'
import type {Config, MuxInputProps, Secrets, VideoAssetDocument} from '../util/types'
import Uploader from './__legacy__Uploader'
import SetupNotice from './SetupNotice'

interface Props extends MuxInputProps {
  asset: VideoAssetDocument | null | undefined
  config: Config
  client: SanityClient
  secrets: Secrets
  needsSetup: boolean
  isInitialSetup: boolean
  dialogState: DialogState
  setDialogState: SetDialogState
}

interface State {
  confirmRemove: boolean
  deleteOnMuxChecked: boolean
  deleteAssetDocumentChecked: boolean
  hasFocus: boolean
  isLoading: boolean | 'secrets'
}

export default class MuxVideoInput extends Component<Props, State> {
  state: State = {
    confirmRemove: false,
    deleteOnMuxChecked: false,
    deleteAssetDocumentChecked: true,
    hasFocus: false,
    isLoading: 'secrets',
  }

  // eslint-disable-next-line no-warning-comments
  // @TODO setup proper Observable typings
  subscription?: any

  componentDidMount() {
    this.setState({
      // If there is an asset continue loading
      isLoading: !!this.props.value?.asset,
    })
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

  handleRemoveVideoButtonClicked = () => {
    this.setState({confirmRemove: true})
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

  handleBrowseButton = () => {
    this.setState({showBrowser: true})
  }

  render() {
    return (
      <>
        {this.props.asset || !this.props.needsSetup ? (
          <Uploader
            config={this.props.config}
            client={this.props.client}
            hasFocus={this.state.hasFocus}
            onBlur={this.handleBlur}
            onFocus={this.handleFocus}
            secrets={this.props.secrets}
            onBrowse={this.handleBrowseButton}
            asset={this.props.asset}
            readOnly={this.props.readOnly}
            onChange={this.props.onChange}
            dialogState={this.props.dialogState}
            setDialogState={this.props.setDialogState}
          />
        ) : (
          <SetupNotice
            isLoading={this.state.isLoading}
            isInitialSetup={this.props.isInitialSetup}
          />
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
                    checked={this.state.deleteOnMuxChecked || this.state.deleteAssetDocumentChecked}
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
                    loading={!!this.state.isLoading}
                  />
                </Grid>
              </Stack>
            </Box>
          </Dialog>
        )}
      </>
    )
  }
}
