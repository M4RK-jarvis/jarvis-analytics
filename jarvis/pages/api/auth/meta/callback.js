export default async function handler(req, res) {
  const code = req.query.code

  if (!code) {
    return res.status(400).json({ error: 'Code manquant' })
  }

  const clientId = process.env.META_APP_ID
  const clientSecret = process.env.META_APP_SECRET
  const redirectUri = process.env.META_REDIRECT_URI

  try {
    // 1) Échange du code contre un short-lived token Instagram
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code: code,
    })

    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      body: body,
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error_type || tokenData.error) {
      return res.status(400).json(tokenData)
    }

    const shortLivedToken = tokenData.access_token

    // 2) Échange contre un long-lived token (60 jours)
    const longLivedRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${shortLivedToken}`
    )

    const longLivedData = await longLivedRes.json()

    if (longLivedData.error) {
      // Fallback : utilise le short-lived si l'échange échoue
      return res.redirect(`/?token=${encodeURIComponent(shortLivedToken)}`)
    }

    const accessToken = longLivedData.access_token

    // 3) Redirection vers l'app avec le token long-lived
    return res.redirect(`/?token=${encodeURIComponent(accessToken)}`)

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
