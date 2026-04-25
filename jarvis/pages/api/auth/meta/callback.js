export default async function handler(req, res) {
  const { code, error, error_reason } = req.query

  // Instagram a refusé la connexion (ex: user a cliqué "Annuler")
  if (error) {
    return res.redirect(`/?error=${encodeURIComponent(error_reason || error)}`)
  }

  if (!code) {
    return res.redirect('/?error=code_manquant')
  }

  const clientId = process.env.META_APP_ID
  const clientSecret = process.env.META_APP_SECRET
  const redirectUri = process.env.META_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    return res.redirect('/?error=configuration_serveur_incomplete')
  }

  try {
    // 1) Échange du code contre un short-lived token
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
      const msg = tokenData.error_message || tokenData.error || 'token_invalide'
      return res.redirect(`/?error=${encodeURIComponent(msg)}`)
    }

    const shortLivedToken = tokenData.access_token

    if (!shortLivedToken) {
      return res.redirect('/?error=token_manquant_dans_reponse')
    }

    // 2) Échange contre un long-lived token (60 jours)
    const longLivedRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${shortLivedToken}`
    )

    const longLivedData = await longLivedRes.json()

    // Fallback propre si l'échange long-lived échoue
    const accessToken = longLivedData.access_token || shortLivedToken

    // 3) Redirection vers le dashboard avec le token
    return res.redirect(`/?token=${encodeURIComponent(accessToken)}`)

  } catch (err) {
    return res.redirect(`/?error=${encodeURIComponent(err.message || 'erreur_serveur')}`)
  }
}
