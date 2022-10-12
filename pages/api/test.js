export default async function handler(req, res) {
  const params = new URLSearchParams(req.query)
  const fetchRes = await fetch(`https://api.mux.com/video/v1/assets?${params.toString()}`, {
    method: 'GET',
    headers: {
      accept: 'application/json',
      authorization: req.headers.authorization,
      'x-source-platform': 'Sanity | vX',
    },
  })
  return res.json(await fetchRes.json())
}
