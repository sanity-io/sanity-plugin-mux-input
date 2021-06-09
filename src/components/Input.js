import {Box, Button, Card, Checkbox, Dialog, Flex, Grid, Inline, Stack, Text} from '@sanity/ui'
import SetupIcon from 'part:@sanity/base/plugin-icon'
import {observePaths} from 'part:@sanity/base/preview'
import DialogContent from 'part:@sanity/components/dialogs/content'
import FullscreenDialog from 'part:@sanity/components/dialogs/fullscreen'
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
import getPosterSrc from '../util/getPosterSrc'
import styles from './Input.css'
import MuxLogo from './MuxLogo'
import SelectAsset from './SelectAsset'
import Setup from './Setup'
import Uploader from './Uploader'
import Video from './Video'

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
    cachedSecrets.token = secrets.token
    cachedSecrets.secretKey = secrets.secretKey
    cachedSecrets.enableSignedUrls = secrets.enableSignedUrls
    cachedSecrets.signingKeyId = secrets.signingKeyId
    cachedSecrets.signingKeyPrivate = secrets.signingKeyPrivate

    return {
      isInitialSetup: !exists,
      needsSetup: !validateSecrets(cachedSecrets),
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
      thumbLoading: false,
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
              // eslint-disable-next-line no-warning-comments
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

    handleOpenThumb = (event) => {
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

      const thumb = getPosterSrc(assetDocument.playbackId, options)
      const newThumb = getPosterSrc(assetDocument.playbackId, {...options, time: currentTime})

      this.setState({thumb, newThumb})
    }

    handleSetThumbButton = (event) => {
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

          this.setState({thumb, thumbLoading: false})
        })
        .catch((error) => {
          this.setState({error, thumbLoading: false})
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
      const {isLoading, isInitialSetup} = this.state

      if (isLoading) {
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
        <Card padding={3} radius={2} shadow={1} tone="positive">
          <Text size={1}>This Mux asset is using a signed url.</Text>
        </Card>
      ) : null
      return (
        <Stack space={2} marginBottom={2}>
          {isSignedAlert}
          <Video
            assetDocument={assetDocument}
            ref={this.videoPlayer}
            onReady={this.handleVideoReadyToPlay}
            onCancel={this.handleRemoveVideo}
          />
        </Stack>
      )
    }

    renderVideoButtons() {
      const {assetDocument, confirmRemove} = this.state
      const {readOnly} = this.props
      if (assetDocument && assetDocument.status === 'ready' && !readOnly) {
        return [
          <Button
            key="browse"
            mode="ghost"
            tone="primary"
            onClick={this.handleBrowseButton}
            text="Browse"
          />,
          <Button
            key="thumbnail"
            mode="ghost"
            tone="primary"
            disabled={this.state.videoReadyToPlay === false}
            onClick={this.handleOpenThumb}
            text="Thumbnail"
          />,
          <Button
            key="remove"
            ref={this.removeVideoButton}
            onClick={confirmRemove ? NOOP : this.handleRemoveVideoButtonClicked}
            mode="ghost"
            tone="critical"
            text="Remove"
          />,
        ]
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
        assetDocument,
      } = this.state

      const cssAspectRatio = assetDocument?.data?.aspect_ratio?.split(':')?.join('/') || 'auto'

      return (
        <Box style={{position: 'relative'}}>
          <Flex align="center" justify="space-between">
            <FormField
              label={type.title}
              markers={markers}
              description={type.description}
              level={level}
              className={styles.formField}
            />
            {this.renderSetupButton()}
          </Flex>

          {isLoading === 'secrets' && (
            <Box marginBottom={2}>
              <Inline align="center" space={2}>
                <Spinner inline />
                <Text size={1}>Fetching credentials</Text>
              </Inline>
            </Box>
          )}

          {needsSetup && this.renderSetupNotice()}

          {!needsSetup && (
            <Uploader
              buttons={this.renderVideoButtons()}
              hasFocus={hasFocus}
              // eslint-disable-next-line react/jsx-handler-names
              onBlur={this.blur}
              // eslint-disable-next-line react/jsx-handler-names
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
        </Box>
      )
    }
  }
)
