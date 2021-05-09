import React, {Component, Fragment} from 'react'
import {of} from 'rxjs'
import {tap} from 'rxjs/operators'
import {withDocument} from 'part:@sanity/form-builder'

import {fetchSecrets} from '../actions/secrets'
import {getAsset, deleteAsset} from '../actions/assets'
import getPosterSrc from '../util/getPosterSrc'

import client from 'part:@sanity/base/client'
import {observePaths} from 'part:@sanity/base/preview'
import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen'
import DialogContent from 'part:@sanity/components/dialogs/content'

import PatchEvent, {set, unset, setIfMissing} from 'part:@sanity/form-builder/patch-event'
import FormField from 'part:@sanity/components/formfields/default'
import Alert from 'part:@sanity/components/alerts/alert'
import SetupIcon from 'part:@sanity/base/plugin-icon'
import Spinner from 'part:@sanity/components/loading/spinner'

import {
  Checkbox,
  Stack,
  Flex,
  Grid,
  Button,
  Dialog,
  Text,
  Box,
  studioTheme,
  ThemeProvider,
} from '@sanity/ui'

import Setup from './Setup'
import Video from './Video'
import SelectAsset from './SelectAsset'
import MuxLogo from './MuxLogo'
import Uploader from './Uploader'
import styles from './Input.css'

const NOOP = () => {
  /* intentional noop */
}

const cachedSecrets = {
  token: null,
  secretKey: null,
  enableSignedUrls: false,
  signingKeyId: null,
  signingKeyPrivate: null,
}

function validateSecrets(secrets) {
  if (secrets.token === null) return true
  if (secrets.secretKey === null) return true

  return false
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
    cachedSecrets.token = secrets.token
    cachedSecrets.secretKey = secrets.secretKey
    cachedSecrets.enableSignedUrls = secrets.enableSignedUrls
    cachedSecrets.signingKeyId = secrets.signingKeyId
    cachedSecrets.signingKeyPrivate = secrets.signingKeyPrivate
    return {
      isInitialSetup: !exists,
      needsSetup: validateSecrets(cachedSecrets),
      secrets: cachedSecrets,
    }
  })
}

export default withDocument(
  class MuxVideoInput extends Component {
    state = {
      assetDocument: null,
      confirmRemove: false,
      deleteOnMuxChecked: true,
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
    }

    constructor(props) {
      super(props)
      getSecrets()
        .then(({secrets, isInitialSetup, needsSetup}) => {
          this.setState({
            secrets,
            isInitialSetup,
            needsSetup,
            isLoading: props.value?.asset, // If there is an asset continue loading
          })
        })
        .catch((error) => this.setState({error}))

      this.setupButton = React.createRef()
      this.pollInterval = null
      this.video = React.createRef()
      this.removeVideoButton = React.createRef()
      this.videoPlayer = React.createRef()
    }

    componentDidMount() {
      this.setupAssetListener()
    }

    componentWillUnmount() {
      if (this.subscription) {
        this.subscription.unsubscribe()
      }
      if (this.pollInterval) {
        clearInterval(this.pollInterval)
        this.pollInterval = null
      }
    }

    focus = () => {
      this.handleFocus()
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
          tap((assetDocument) => {
            this.setState({assetDocument})
            if (assetDocument && assetDocument.status === 'errored') {
              clearInterval(this.pollInterval)
              this.pollInterval = null
              // todo: use client.observable
              return this.handleRemoveVideo().then(() => {
                this.setState({
                  isLoading: false,
                  error: new Error(assetDocument.data.errors.messages.join(' ')),
                })
              })
            }
            if (assetDocument && assetDocument.status === 'preparing') {
              this.pollMux()
            }
            if (assetDocument && assetDocument.status === 'ready') {
              clearInterval(this.pollInterval)
              this.pollInterval = null
            }

            // eslint-disable-next-line camelcase
            const isSigned = assetDocument?.data?.playback_ids[0]?.policy === 'signed'
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
      this.pollInterval = setInterval(() => {
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

    handleSetupButtonClicked = (event) => {
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
        needsSetup: validateSecrets(cachedSecrets),
      })
    }

    handleCancelSaveSetup = () => {
      this.setState({showSetup: false})
    }

    handleOnUploadComplete = (result) => {
      const {onChange} = this.props
      const {_id} = result
      onChange(
        PatchEvent.from([setIfMissing({asset: {_ref: _id}}, []), set({_ref: _id}, ['asset'])])
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
        return new Promise((resolve, reject) => {
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

    handleCancelRemove = (event) => {
      this.setState({
        confirmRemove: false,
        deleteOnMuxChecked: true,
        deleteAssetDocumentChecked: true,
      })
    }

    handleDeleteOnMuxCheckBoxClicked = (event) => {
      this.setState((prevState) => ({
        deleteOnMuxChecked: !prevState.deleteOnMuxChecked,
      }))
    }

    handleDeleteAssetDocumentCheckBoxClicked = (event) => {
      this.setState((prevState) => ({
        deleteAssetDocumentChecked: !prevState.deleteAssetDocumentChecked,
      }))
    }

    handleSetThumbButton = (event) => {
      if (!this.videoPlayer.current) {
        return
      }
      const {assetDocument, isSigned} = this.state
      const currentTime = this.videoPlayer.current.getVideoElement().currentTime
      client
        .patch(assetDocument._id)
        .set({
          thumbTime: currentTime,
        })
        .commit({returnDocuments: false})
        .then((response) => {
          const options = {
            time: currentTime,
            width: 320,
            height: 320,
            fitMode: 'crop',
            isSigned,
            signingKeyId: cachedSecrets.signingKeyId,
            signingKeyPrivate: cachedSecrets.signingKeyPrivate,
          }

          const thumb = getPosterSrc(assetDocument.playbackId, options)

          this.setState({thumb})
        })
        .catch((error) => {
          this.setState({error})
        })
    }

    handleErrorClose = (event) => {
      if (event) {
        event.preventDefault()
      }
      this.setState({
        error: null,
      })
    }

    handleCloseThumbPreview = (event) => {
      this.setState({thumb: null})
    }

    handleBrowseButton = (event) => {
      this.setState({showBrowser: true})
    }

    handleCloseBrowser = (event) => {
      this.setState({showBrowser: false})
    }

    handleSelectAsset = (asset) => {
      const {onChange} = this.props
      onChange(
        PatchEvent.from([
          setIfMissing({asset: {_ref: asset._id}}, []),
          set({_ref: asset._id}, ['asset']),
        ])
      )
      this.setState({showBrowser: false, assetDocument: asset}, () => {
        this.setupAssetListener()
      })
    }

    handleVideoReadyToPlay = () => {
      this.setState({videoReadyToPlay: true})
    }

    renderSetup() {
      const {secrets} = this.state

      return (
        <Dialog
          header="MUX API Credentials"
          width={1}
          onClose={this.handleCancelSaveSetup}
          zOffset={1000}
        >
          <Setup
            secrets={secrets || null}
            onSave={this.handleSaveSetup}
            onCancel={this.handleCancelSaveSetup}
          />
        </Dialog>
      )
    }

    renderSetupButton() {
      const {isLoading, showSetup, needsSetup} = this.state
      const renderSetup = !isLoading && showSetup
      return (
        <div className={styles.setupButtonContainer}>
          <Button
            tone={needsSetup ? 'critical' : 'positive'}
            mode="bleed"
            onClick={this.handleSetupButtonClicked}
            icon={SetupIcon}
            padding={3}
            radius={3}
            aria-label="Set up Mux credentials"
          />
          {renderSetup && this.renderSetup()}
        </div>
      )
    }

    renderSetupNotice() {
      const {isLoading, needsSetup, isInitialSetup} = this.state
      const renderSetupNotice = needsSetup
      if (isLoading || !renderSetupNotice) {
        return null
      }
      return (
        <Stack padding={4} space={5} style={{backgroundColor: '#efefefef', borderRadius: 3}}>
          <MuxLogo />
          <Stack space={4}>
            {isInitialSetup && (
              <Text>
                Looks like this is the first time you are using the MUX video plugin in this
                dataset. Great!
              </Text>
            )}
            <Text>Before you can upload video, you must set your MUX credentials.</Text>
            <Text>Click the plugin button in the field title to open Setup.</Text>
          </Stack>
        </Stack>
      )
    }

    // eslint-disable-next-line complexity
    renderAsset() {
      const {assetDocument, isSigned} = this.state
      const renderAsset = !!assetDocument
      if (!renderAsset) {
        return null
      }
      const isSignedAlert = isSigned ? (
        <div className={styles.alert}>
          <Alert title="Note" color="success">
            This mux asset is using a signed url
          </Alert>
        </div>
      ) : null
      return (
        <>
          {isSignedAlert}
          <Video
            assetDocument={assetDocument}
            ref={this.videoPlayer}
            onReady={this.handleVideoReadyToPlay}
            onCancel={this.handleRemoveVideo}
          />
        </>
      )
    }

    renderVideoButtons() {
      const {assetDocument, confirmRemove} = this.state
      const {readOnly} = this.props
      if (assetDocument && assetDocument.status === 'ready' && !readOnly) {
        return (
          <Fragment>
            <Button
              mode="ghost"
              tone="default"
              onClick={this.handleBrowseButton}
              text="Browse"
              style={{textAlign: 'center'}}
            />
            <Button
              mode="ghost"
              tone="default"
              disabled={this.state.videoReadyToPlay === false}
              onClick={this.handleSetThumbButton}
              text="Thumbnail"
              style={{textAlign: 'center'}}
            />
            <Button
              ref={this.removeVideoButton}
              onClick={confirmRemove ? NOOP : this.handleRemoveVideoButtonClicked}
              mode="ghost"
              tone="critical"
              text="Remove"
            />
          </Fragment>
        )
      }
      return null
    }

    renderBrowser() {
      return (
        <FullscreenDialog title="Select video" onClose={this.handleCloseBrowser} isOpen>
          <SelectAsset onSelect={this.handleSelectAsset} />
        </FullscreenDialog>
      )
    }

    renderError() {
      const {error} = this.state
      if (!error) {
        return null
      }
      return (
        <Dialog header="Error" onClose={this.handleErrorClose}>
          <DialogContent size="small">{error.message}</DialogContent>
        </Dialog>
      )
    }

    render() {
      const {type, level, markers} = this.props
      const {
        isLoading,
        secrets,
        hasFocus,
        needsSetup,
        error,
        showBrowser,
        confirmRemove,
        thumb,
      } = this.state
      return (
        <ThemeProvider theme={studioTheme}>
          <div className={styles.root}>
            <div className={styles.header}>
              <FormField
                label={type.title}
                markers={markers}
                description={type.description}
                level={level}
                className={styles.formField}
              />
              {this.renderSetupButton()}
            </div>

            {isLoading === 'secrets' && (
              <div className={styles.isLoading}>
                <Spinner inline />
                <span>Fetching credentials</span>
              </div>
            )}

            {this.renderSetupNotice()}

            {!needsSetup && (
              <Uploader
                buttons={this.renderVideoButtons()}
                hasFocus={hasFocus}
                onBlur={this.blur}
                onFocus={this.focus}
                onSetupButtonClicked={this.handleSetupButtonClicked}
                onUploadComplete={this.handleOnUploadComplete}
                secrets={secrets}
                onBrowse={this.handleBrowseButton}
              >
                {this.renderAsset()}
              </Uploader>
            )}

            {thumb && (
              <Dialog
                header="Current thumbnail frame:"
                zOffset={1000}
                onClose={this.handleCloseThumbPreview}
              >
                <Box padding={4}>
                  <img style={{maxWidth: '100%'}} src={this.state.thumb} width={400} />
                </Box>
              </Dialog>
            )}

            {showBrowser && this.renderBrowser()}

            {confirmRemove && (
              <Dialog header="Remove video" zOffset={1000} onClose={this.handleCancelRemove}>
                <Box padding={4}>
                  <Stack space={3}>
                    <Flex align="center">
                      <Checkbox
                        checked={this.state.deleteOnMuxChecked}
                        onChange={this.handleDeleteOnMuxCheckBoxClicked}
                      />
                      <Text style={{margin: '0 10px'}}>Delete asset on MUX.com</Text>
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
                        loading={!!isLoading}
                      />
                      <Button
                        mode="default"
                        tone="critical"
                        text="Remove"
                        onClick={this.handleRemoveVideo}
                        loading={!!isLoading}
                      />
                    </Grid>
                  </Stack>
                </Box>
              </Dialog>
            )}

            {error && this.renderError()}
          </div>
        </ThemeProvider>
      )
    }
  }
)
