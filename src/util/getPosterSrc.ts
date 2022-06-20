import memoize from 'lodash.memoize'
import {suspend} from 'suspend-react'

import type {Secrets} from '../types'
import {generateJwt} from './generateJwt'

export type Options = Pick<Secrets, 'signingKeyId' | 'signingKeyPrivate'> & {
  isSigned: boolean
  width: number
  height: number | string | null
  time: number
  fit_mode: 'preserve' | 'crop' | 'smartcrop'
}

const getParams = memoize(
  (
    width: Options['width'] = 640,
    time: Options['time'] = 1,
    fit_mode: Options['fit_mode'] = 'preserve',
    height?: Options['height']
  ): Required<Pick<Options, 'width' | 'height' | 'time' | 'fit_mode'>> => {
    const params: Required<Pick<Options, 'width' | 'time' | 'fit_mode'>> & Pick<Options, 'height'> =
      {width, time, fit_mode, height: undefined}

    if (height) {
      params.height = height.toString()
    }

    return params
  }
)

export function getPosterSrc(playbackId: string, options: Partial<Options> = {}) {
  const {width, height, time, fit_mode, isSigned = false} = options
  const params = getParams(width, time, fit_mode, height)

  let qs
  if (isSigned && options.signingKeyId && options.signingKeyPrivate) {
    console.warn('About to suspend')
    const token = suspend(generateJwt, [
      playbackId,
      options.signingKeyId,
      options.signingKeyPrivate,
      't',
      params,
    ])
    /*
    const token = await generateJwt(
      playbackId,
      options.signingKeyId,
      options.signingKeyPrivate,
      't',
      params
    )
    // */
    qs = `token=${token}`
  } else {
    qs = Object.keys(params)
      .map((key) => `${key}=${params[key]}`)
      .join('&')
  }

  return `https://image.mux.com/${playbackId}/thumbnail.png?${qs}`
}
