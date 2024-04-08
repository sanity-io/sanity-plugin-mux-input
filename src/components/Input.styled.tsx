import {Box, Card, Flex, Spinner, Text} from '@sanity/ui'

export const InputFallback = () => {
  return (
    <div style={{padding: 1}}>
      <Card
        shadow={1}
        sizing="border"
        style={{aspectRatio: '16/9', width: '100%', borderRadius: '1px'}}
      >
        <Flex align="center" direction="column" height="fill" justify="center">
          <Spinner muted />
          <Box marginTop={3}>
            <Text align="center" muted size={1}>
              Loading…
            </Text>
          </Box>
        </Flex>
      </Card>
    </div>
  )
}
