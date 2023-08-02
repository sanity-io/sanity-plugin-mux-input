import {studioTheme, ThemeProvider} from '@sanity/ui'
import React from 'react'
import {Tool} from 'sanity'

import {Config} from '../util/types'
import ToolIcon from './icons/ToolIcon'
import VideosBrowser from './VideosBrowser'

const StudioTool: React.FC<Config> = () => {
  return (
    <ThemeProvider theme={studioTheme}>
      <VideosBrowser />
    </ThemeProvider>
  )
}

export default function createStudioTool(config: Config): Tool {
  const toolConfig = typeof config.tool === 'object' ? config.tool : {}
  return {
    name: 'mux',
    title: toolConfig.title || 'Videos',
    component: (props: any) => <StudioTool {...config} {...props} />,
    icon: toolConfig.icon || ToolIcon,
  }
}
