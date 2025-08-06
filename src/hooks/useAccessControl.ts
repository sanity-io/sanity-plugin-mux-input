import {useCurrentUser} from 'sanity'
import {PluginConfig} from '../util/types'

export const useAccessControl = (config: PluginConfig) => {
  const user = useCurrentUser()

  const hasConfigAccess =
    config?.allowedRolesForConfiguration === undefined ||
    config.allowedRolesForConfiguration.length === 0 ||
    user?.roles?.some((role) => config.allowedRolesForConfiguration.includes(role.name))

  return {hasConfigAccess}
}
