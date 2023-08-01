import {useEffect, useState} from 'react'
import {set, useDocumentStore} from 'sanity'

import useDocReferences from '../../hooks/useDocReferences'
import getVideoMetadata from '../../util/getVideoMetadata'
import {PluginPlacement, VideoAssetDocument} from '../../util/types'

export interface FileDetailsProps {
  placement: PluginPlacement
  closeDialog: () => void
  asset: VideoAssetDocument & {autoPlay?: boolean}
}

export default function useFileDetails(props: FileDetailsProps) {
  const documentStore = useDocumentStore()
  const [references, referencesLoading] = useDocReferences({
    documentStore,
    id: props.asset._id as string,
  })

  const [filename, setFilename] = useState(props.asset.filename)
  const modified = filename !== props.asset.filename

  const displayInfo = getVideoMetadata({...props.asset, filename})

  const [state, setState] = useState<
    | 'deleting.processing_deletion'
    | 'deleting.checkingReferences'
    | 'deleting.error_deleting'
    | 'deleting.cantDelete'
    | 'deleting.confirm'
    | 'closing.confirm'
    | 'idle'
  >()

  function stateMatches(s: string) {
    const currentSubstates = state?.split('.') || []
    return s.split('.').every((subState) => currentSubstates.includes(subState))
  }

  const stateMachine = {
    idle: {
      on: {
        DELETE: 'deleting.checkingReferences',
        CLOSE: 'closing.confirm',
      },
    },
    closing: {
      confirm: {
        on: {
          CONFIRM: {
            target: 'idle',
            action: () => props.closeDialog(),
          },
          CANCEL: {
            target: 'idle',
          },
        },
      },
    },
    deleting: {
      checkingReferences: {},
    },
  }

  async function deleteFile() {
    setState('deleting.processing_deletion')
  }

  function send(event: string): void {
    if (stateMatches('closing')) {
      if (event === 'CONFIRM') props.closeDialog()

      return setState('idle')
    }

    if (stateMatches('deleting.confirm')) {
      if (state === 'deleting.confirm' && event === 'CONFIRM') {
        return deleteFile()
      }
    }

    if (state === 'idle') {
      switch (event) {
        case 'CLOSE':
          if (modified) {
            return setState('closing.confirm')
          }
          return props.closeDialog()
        case 'DELETE':
          return setState('deleting.checkingReferences')
        default:
          break
      }
    }
  }

  useEffect(() => {
    if (!referencesLoading && state === 'deleting.checkingReferences') {
      setState('')
    }
  }, [state, referencesLoading])

  return {
    references,
    referencesLoading,
    modified,
    filename,
    setFilename,
    displayInfo,
    send,
    stateMatches,
  }
}
