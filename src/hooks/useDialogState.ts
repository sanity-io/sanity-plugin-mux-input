// Handy little state machine to simplify managing which root level dialog to open

import {useState} from 'react'

export type DialogState = 'secrets' | 'download-asset' | 'select-video' | 'edit-thumbnail' | 'edit-captions' | false

export function useDialogState() {
  return useState<DialogState>(false)
}

export type SetDialogState = ReturnType<typeof useDialogState>[1]
