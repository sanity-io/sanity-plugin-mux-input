import {Box, Checkbox, Flex, Stack, Text} from '@sanity/ui'

import {UploadConfigurationStateAction} from '../UploadConfiguration'

export default function UploadConfiguration({
  id,
  checked,
  optionName,
  description,
  dispatch,
  action,
}: {
  id: string
  checked: boolean
  optionName: string
  description: string
  dispatch: any
  action: UploadConfigurationStateAction['action']
}) {
  const handleBoxClick = () => {
    dispatch({
      action,
      value: !checked,
    })
  }
  return (
    <Box padding={[3, 3, 4, 5]} style={{outline: '1px solid grey'}} onClick={handleBoxClick}>
      <Stack space={[3, 3, 4, 5]}>
        <Flex align="center" gap={2}>
          <Checkbox id={id} required checked={checked} onChange={() => {}} />
          <Text size={[2, 2, 3, 4]}>{optionName}</Text>
        </Flex>

        <Text muted size={[1, 1, 2]}>
          {description}
        </Text>
      </Stack>
    </Box>
  )
}
