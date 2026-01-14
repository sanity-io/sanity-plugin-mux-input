export function extractErrorMessage(
  error: unknown,
  defaultMessage = 'Failed to process request'
): string {
  let message = ''

  if (error && typeof error === 'object') {
    const err = error as {response?: {body?: {message?: string}}; message?: string}
    message = err.response?.body?.message || err.message || ''
  } else if (typeof error === 'string') {
    message = error
  }

  if (!message) {
    return defaultMessage
  }

  const match = message.match(/\(([^)]+)\)/)
  if (match && match[1]) {
    return match[1]
  }

  if (message.includes('responded with')) {
    const parts = message.split('(')
    if (parts.length > 1) {
      return parts[parts.length - 1].replace(')', '').trim()
    }
  }

  return message
}
