import type {Tool} from 'sanity'

import type {PluginConfig} from '../util/types'
import ToolIcon from './icons/ToolIcon'
import VideosBrowser from './VideosBrowser'

const StudioTool: React.FC<PluginConfig> = () => {
  return <VideosBrowser />
}

export const DEFAULT_TOOL_CONFIG = {
  icon: ToolIcon,
  title: 'Videos',
}

export default function createStudioTool(config: PluginConfig): Tool {
  const toolConfig = typeof config.tool === 'object' ? config.tool : DEFAULT_TOOL_CONFIG
  return {
    name: 'mux',
    icon: toolConfig.icon || DEFAULT_TOOL_CONFIG.icon,
    title: toolConfig.title || DEFAULT_TOOL_CONFIG.title,
    component: (props: any) => <StudioTool {...config} {...props} />,
  }
}
