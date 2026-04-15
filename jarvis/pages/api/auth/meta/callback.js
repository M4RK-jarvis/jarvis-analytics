export default async function handler(req, res) {
  const code = req.query.code

  if (!code) {
    return res.status(400).json({ error: 'Code manquant' })
  }

  const clientId = process.env.META_APP_ID
  const clientSecret = process.env.META_APP_SECRET
  const redirectUri = process.env.META_REDIRECT_URI

  try {
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${redirectUri}&code=${code}`
    )

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      return res.status(400).json(tokenData)
    }

    return res.status(200).json({
      access_token: tokenData.access_token
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
