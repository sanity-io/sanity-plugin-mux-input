import {Flex, Spinner} from '@sanity/ui'

const style = {minHeight: '150px'}

const SpinnerBox: React.FC = () => (
  <Flex align="center" justify="center" style={style}>
    <Spinner />
  </Flex>
)

export default SpinnerBox
