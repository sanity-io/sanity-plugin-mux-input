import {Box, Flex, Stack, Text} from '@sanity/ui'
import React, {memo} from 'react'

// @TODO: get rid of this once v3 core is stable

export interface Props {
  children: React.ReactNode
  title: React.ReactNode
  description?: React.ReactNode
  inputId: string
}

function FormField(props: Props) {
  const {children, title, description, inputId} = props

  return (
    <Stack space={1}>
      <Flex align="flex-end">
        <Box flex={1} paddingY={2}>
          <Stack space={2}>
            <Flex>
              <Text as="label" htmlFor={inputId} weight="semibold" size={1}>
                {title || <em>Untitled</em>}
              </Text>

              {description && (
                <Text muted size={1}>
                  {description}
                </Text>
              )}
            </Flex>
          </Stack>
        </Box>
      </Flex>
      <div>{children}</div>
    </Stack>
  )
}

export default memo(FormField)
