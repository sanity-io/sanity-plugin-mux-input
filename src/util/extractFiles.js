/**
 * Utilities for extracting files from dataTransfer in a predictable cross-browser fashion.
 * Also recursively extracts files from a directory
 * Inspired by https://github.com/component/normalized-upload
 */

import {flatten} from 'lodash'

export function extractDroppedFiles(dataTransfer) {
  const files = Array.from(dataTransfer.files || [])
  const items = Array.from(dataTransfer.items || [])
  if (files && files.length > 0) {
    return Promise.resolve(files)
  }
  return normalizeItems(items).then(flatten)
}

function normalizeItems(items) {
  return Promise.all(
    items.map(item => {
      // directory
      if (item.kind === 'file' && item.webkitGetAsEntry) {
        let entry
        // Edge throws
        try {
          entry = item.webkitGetAsEntry()
        } catch (err) {
          return [item.getAsFile()]
        }
        if (!entry) {
          return []
        }
        return entry.isDirectory ? walk(entry) : [item.getAsFile()]
      }

      // file
      if (item.kind === 'file') {
        const file = item.getAsFile()
        return Promise.resolve(file ? [file] : [])
      }

      // others
      return new Promise(resolve => item.getAsString(resolve)).then(
        str => (str ? [new File([str], 'unknown.txt', {type: item.type})] : [])
      )
    })
  )
}

function walk(entry) {
  if (entry.isFile) {
    return new Promise(resolve => entry.file(resolve)).then(file => [file])
  }

  if (entry.isDirectory) {
    const dir = entry.createReader()
    return new Promise(resolve => dir.readEntries(resolve))
      .then(entries => entries.filter(entr => !entr.name.startsWith('.')))
      .then(entries => Promise.all(entries.map(walk)).then(flatten))
  }
  return Promise.resolve([])
}
