import {Box, Spinner} from '@sanity/ui'

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
