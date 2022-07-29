/* eslint-disable no-console */
import {Button, Card, Flex, Grid, Heading, Inline, Text, useToast} from '@sanity/ui'
import React, {memo, useCallback, useRef} from 'react'
import scrollIntoView from 'scroll-into-view-if-needed'
import {clear} from 'suspend-react'
import {useErrorBoundary} from 'use-error-boundary'

import {name} from '../util/constants'
import {type MuxInputProps} from '../util/types'

export interface Props extends Pick<MuxInputProps, 'schemaType'> {
  children: React.ReactNode
}
function ErrorBoundaryCard(props: Props) {
  const {children, schemaType} = props
  const {push: pushToast} = useToast()
  const errorRef = useRef(null)
  const {ErrorBoundary, didCatch, error, reset} = useErrorBoundary({
    onDidCatch: (err, errorInfo) => {
      console.group(err.toString())
      console.groupCollapsed('console.error')
      console.error(err)
      console.groupEnd()
      if (err.stack) {
        console.groupCollapsed('error.stack')
        console.log(err.stack)
        console.groupEnd()
      }
      if (errorInfo?.componentStack) {
        console.groupCollapsed('errorInfo.componentStack')
        console.log(errorInfo.componentStack)
        console.groupEnd()
      }
      console.groupEnd()
      pushToast({
        status: 'error',
        title: 'Plugin crashed',
        description: (
          <Flex align="center">
            <Inline space={1}>
              An error happened while rendering
              <Button
                padding={1}
                fontSize={1}
                style={{transform: 'translateY(1px)'}}
                mode="ghost"
                text={schemaType.title}
                onClick={() => {
                  if (errorRef.current) {
                    scrollIntoView(errorRef.current, {
                      behavior: 'smooth',
                      scrollMode: 'if-needed',
                      block: 'center',
                    })
                  }
                }}
              />
            </Inline>
          </Flex>
        ),
      })
    },
  })
  const handleRetry = useCallback(() => {
    // Purge request cache before retrying, otherwise the cached errors will rethrow
    clear([name])

    reset()
  }, [reset])

  if (didCatch) {
    return (
      <Card ref={errorRef} paddingX={[2, 3, 4, 4]} height="fill" shadow={1} overflow="auto">
        <Flex justify="flex-start" align="center" height="fill">
          <Grid columns={1} gap={[2, 3, 4, 4]}>
            <Heading as="h1">
              The <code>{name}</code> plugin crashed
            </Heading>
            {error?.message && (
              <Card padding={3} tone="critical" shadow={1} radius={2}>
                <Text>{error.message}</Text>
              </Card>
            )}
            <Inline>
              <Button onClick={handleRetry} text="Retry" />
            </Inline>
          </Grid>
        </Flex>
      </Card>
    )
  }

  return <ErrorBoundary>{children}</ErrorBoundary>
}

export default memo(ErrorBoundaryCard)
