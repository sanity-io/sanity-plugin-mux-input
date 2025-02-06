/* eslint-disable */
// From: https://stackoverflow.com/a/11486026/10433647
export function formatSeconds(seconds: number): string {
  if (typeof seconds !== 'number' || Number.isNaN(seconds)) {
    return ''
  }
  // Hours, minutes and seconds
  const hrs = ~~(seconds / 3600)
  const mins = ~~((seconds % 3600) / 60)
  const secs = ~~seconds % 60

  // Output like "1:01" or "4:03:59" or "123:03:59"
  let ret = ''

  if (hrs > 0) {
    ret += '' + hrs + ':' + (mins < 10 ? '0' : '')
  }

  ret += '' + mins + ':' + (secs < 10 ? '0' : '')
  ret += '' + secs
  return ret
}

// Output like "05:14:01"
export function formatSecondsToHHMMSS(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, '0')
  const mins = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, '0')
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0')

  return `${hrs}:${mins}:${secs}`
}

// Checks if time has a HH:MM:SS format like "05:14:01"
export function isValidTimeFormat(time: string) {
  const regex = /^([0-1]?[0-9]|2[0-3]):([0-5]?[0-9]):([0-5]?[0-9])$/
  return regex.test(time) || time === ''
}

// Converts a time like "05:14:01" to seconds
export function getSecondsFromTimeFormat(time: string): number {
  const [hh = 0, mm = 0, ss = 0] = time.split(':').map(Number)
  return hh * 3600 + mm * 60 + ss
}
