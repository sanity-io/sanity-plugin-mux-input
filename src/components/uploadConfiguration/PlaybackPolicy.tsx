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
    <Box padding={3} style={{outline: '0.01rem solid grey'}} onClick={handleBoxClick}>
      <Stack space={2}>
        <Flex align="center" gap={2}>
          <Checkbox id={id} required checked={checked} onChange={() => {}} />
          <Text weight="bold" size={2}>
            {optionName}
          </Text>
        </Flex>

        <Text muted size={1}>
          {description}
        </Text>
      </Stack>
    </Box>
  )
}
