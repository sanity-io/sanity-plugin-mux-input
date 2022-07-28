// @TODO find and document when and why this happens, and if the final fix would be to put @sanity/ui in peerDependencies
// If there's a crash due to a @sanity/ui mismatch (multiple instances so the ThemeProvider context fails to propagate)
// This component will wrap the children in the default studioTheme in a workaround
import {ThemeProvider} from '@sanity/ui'
import React from 'react'
import {defaultTheme} from 'sanity'
import {useErrorBoundary} from 'use-error-boundary'

interface Props {
  children: React.ReactNode
}
const ThemeProviderFixer = ({children}: Props) => {
  const {ErrorBoundary, didCatch, error} = useErrorBoundary()

  if (didCatch) {
    return error.message.startsWith('Cannot destructure property') &&
      error.message.endsWith(`of 'theme.sanity' as it is undefined.`) ? (
      <ThemeProvider theme={defaultTheme}>{children}</ThemeProvider>
    ) : (
      <>{children}</>
    )
  }

  return <ErrorBoundary>{children}</ErrorBoundary>
}

export default ThemeProviderFixer
