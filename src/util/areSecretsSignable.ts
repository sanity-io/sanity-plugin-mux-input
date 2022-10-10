import type {Secrets, SignableSecrets} from './types'

export function areSecretsSignable(secrets: Secrets): secrets is SignableSecrets {
  return !!secrets.signingKeyId && !!secrets.signingKeyPrivate
}
