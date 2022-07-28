import React, {createContext, useContext} from 'react'

import type {Config} from '../util/types'

const ConfigContext = createContext<Config>(null)

export function useConfig() {
  return useContext(ConfigContext)
}
