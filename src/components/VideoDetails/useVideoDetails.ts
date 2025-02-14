import {useToast} from '@sanity/ui'
import {useMemo, useState} from 'react'
import {useDocumentStore} from 'sanity'

import {useClient} from '../../hooks/useClient'
import useDocReferences from '../../hooks/useDocReferences'
import getVideoMetadata from '../../util/getVideoMetadata'
import {PluginPlacement, VideoAssetDocument} from '../../util/types'

export interface VideoDetailsProps {
  placement: PluginPlacement
  closeDialog: () => void
  asset: VideoAssetDocument & {autoPlay?: boolean}
}

export default function useVideoDetails(props: VideoDetailsProps) {
  const documentStore = useDocumentStore()
  const toast = useToast()
  const client = useClient()

  const [references, referencesLoading] = useDocReferences(
    useMemo(() => ({documentStore, id: props.asset._id}), [documentStore, props.asset._id])
  )

  const [originalAsset, setOriginalAsset] = useState(() => props.asset)
  const [filename, setFilename] = useState(props.asset.filename)
  const modified = filename !== originalAsset.filename

  const displayInfo = getVideoMetadata({...props.asset, filename})

  const [state, setState] = useState<'deleting' | 'closing' | 'idle' | 'saving'>('idle')

  function handleClose() {
    if (state !== 'idle') return

    if (modified) {
      setState('closing')
      return
    }

    props.closeDialog()
  }

  function confirmClose(shouldClose: boolean) {
    if (state !== 'closing') return

    if (shouldClose) props.closeDialog()

    setState('idle')
  }

  async function saveChanges() {
    if (state !== 'idle') return
    setState('saving')

    try {
      await client.patch(props.asset._id).set({filename}).commit()
      setOriginalAsset((prev) => ({...prev, filename}))
      toast.push({
        title: 'Video title updated',
        description: `New title: ${filename}`,
        status: 'success',
      })
      props.closeDialog()
    } catch (error) {
      toast.push({
        title: 'Failed updating file name',
        status: 'error',
        description: typeof error === 'string' ? error : 'Please try again',
      })
      setFilename(originalAsset.filename)
    }

    setState('idle')
  }

  return {
    references,
    referencesLoading,
    modified,
    filename,
    setFilename,
    displayInfo,
    state,
    setState,
    handleClose,
    confirmClose,
    saveChanges,
  }
}
