import React from 'react'
import PropTypes from 'prop-types'
import styles from './UploadPlaceholder.css'
import UploadIcon from 'part:@sanity/base/upload-icon'
import {Flex} from '@sanity/ui'
import {FiUpload, FiCopy} from 'react-icons/fi'

export default class UploadPlaceholder extends React.PureComponent {
  static propTypes = {
    hasFocus: PropTypes.bool,
    invalidPaste: PropTypes.bool,
    invalidFile: PropTypes.bool,
    isDraggingOver: PropTypes.bool
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
