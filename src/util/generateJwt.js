import * as jwt from 'jsonwebtoken'

const getPrivateKey = (key) => Buffer.from(key, 'base64')

const generateJwt = (
  playbackId,
  signingKeyId,
  signingKeyPrivate,
  aud,
  payload = {}
) => jwt.sign(payload, getPrivateKey(signingKeyPrivate), {
  algorithm: 'RS256',
  keyid: signingKeyId,
  audience: aud,
  subject: playbackId,
  noTimestamp: true,
  expiresIn: '12h'
})

export default generateJwt
