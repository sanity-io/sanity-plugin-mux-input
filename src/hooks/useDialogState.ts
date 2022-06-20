// Handy little state machine to simplify managing which root level dialog to open

import {useState} from 'react'

export type DialogState = 'secrets' | 'select-video' | 'edit-thumbnail' | false

export function useDialogState() {
  return useState<DialogState>(false)
}

export type SetDialogState = ReturnType<typeof useDialogState>[1]
