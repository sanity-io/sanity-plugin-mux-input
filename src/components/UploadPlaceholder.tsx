import {Flex} from '@sanity/ui'
import React from 'react'
import {FiCopy, FiUpload} from 'react-icons/all'

import styles from './UploadPlaceholder.module.css'

export interface Props {
  invalidPaste?: boolean
  invalidFile?: boolean
  isDraggingOver?: boolean
  hasFocus?: boolean
}

export default class UploadPlaceholder extends React.PureComponent<Props> {
  static defaultProps = {
    hasFocus: false,
    invalidPaste: false,
    invalidFile: false,
    isDraggingOver: false,
  }
  render() {
    const {invalidPaste, invalidFile, hasFocus, isDraggingOver} = this.props
    const fileClassNames = [styles.dropFile]
    const pasteClassNames = [styles.pasteFile]
    if (invalidFile) {
      fileClassNames.push(styles.invalidFile)
    }
    if (isDraggingOver) {
      fileClassNames.push(styles.isDraggingOver)
    }
    if (invalidPaste) {
      pasteClassNames.push(styles.invalidPaste)
    }
    if (hasFocus) {
      pasteClassNames.push(styles.hasFocus)
    }
    return (
      <div>
        <Flex justify="center" align="center" padding={3}>
          <div className={fileClassNames.join(' ')}>
            <div className={styles.iconContainer}>
              <FiUpload size="0.5em" />
            </div>
            <p className={styles.strong}>
              <span>Drop file {invalidFile}</span>
            </p>
          </div>
          <div className={pasteClassNames.join(' ')}>
            <div className={styles.iconContainer}>
              <FiCopy {...(invalidPaste ? {color: 'red'} : {})} size="0.5em" />
            </div>
            <div>
              <p className={styles.strong}>
                <span>Paste URL</span>
              </p>
            </div>
          </div>
        </Flex>
      </div>
    )
  }
}
