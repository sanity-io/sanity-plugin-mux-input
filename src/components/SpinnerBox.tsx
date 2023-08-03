import {Box, Spinner} from '@sanity/ui'
import React from 'react'

const SpinnerBox: React.FC = () => (
  <Box
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '150px',
    }}
  >
    <Spinner />
  </Box>
)

export default SpinnerBox
