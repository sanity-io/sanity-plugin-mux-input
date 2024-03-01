import type {MuxAsset} from './types'

export function parseMuxDate(date: MuxAsset['created_at']): Date {
  return new Date(Number(date) * 1000)
}
