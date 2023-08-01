import {studioTheme, ThemeProvider} from '@sanity/ui'
import React from 'react'
import {Tool} from 'sanity'

import {Config} from '../util/types'
import MuxLogo from './MuxLogo'
import VideoSource from './VideoSource'

const StudioTool: React.FC<Config> = () => {
  return (
    <ThemeProvider theme={studioTheme}>
      <VideoSource />
    </ThemeProvider>
  )
}

export default function createStudioTool(config: Config): Tool {
  return {
    name: 'mux',
    title: 'Mux videos',
    component: (props: any) => <StudioTool {...config} {...props} />,
    icon: () => <MuxLogo height={20} />,
  }
}
