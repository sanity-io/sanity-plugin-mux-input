/*
 aud:
  v (Video or Subtitles/Closed Captions)
  t (Thumbnail)
  g (GIF)
  s (Storyboard)
*/

export type Audience =
  //  (Video or Subtitles/Closed Captions)
  | 'v'
  // Thumbnail
  | 't'
  // GIF
  | 'g'
  // Storyboard
  | 's'

export const generateJwt = async (
  playbackId: string,
  signingKeyId: string,
  signingKeyPrivate: string,
  aud?: Audience,
  payload: any = {}
): Promise<string> => {
  // This package is HUGE due to node polyfills, so we only load it on demand using code splitting
  const {default: sign} = await import('jsonwebtoken-esm/sign')
  return sign(payload, atob(signingKeyPrivate), {
    algorithm: 'RS256',
    keyid: signingKeyId,
    audience: aud,
    subject: playbackId,
    expiresIn: '12h',
    noTimestamp: true,
  })
}
