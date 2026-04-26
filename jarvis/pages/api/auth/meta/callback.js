export default async function handler(req, res) {
  const { code, error, error_reason } = req.query

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
    // 1) Échange du code contre un short-lived token (nouvelle API Instagram)
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code: code,
    })

    const tokenRes = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      body: body,
    })
    const tokenData = await tokenRes.json()

    if (tokenData.error_type || tokenData.error) {
      return res.redirect(`/?error=${encodeURIComponent(tokenData.error_message || tokenData.error || 'token_invalide')}`)
    }

    const shortToken = tokenData.access_token
    const igUserId = tokenData.user_id

    if (!shortToken || !igUserId) {
      return res.redirect('/?error=token_ou_id_manquant')
    }

    // 2) Échange contre un long-lived token (60 jours)
    const longRes = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${shortToken}`
    )
    const longData = await longRes.json()

    const accessToken = longData.access_token || shortToken

    // 3) Redirige avec le token + l'ID IG
    return res.redirect(
      `/?token=${encodeURIComponent(accessToken)}&igid=${encodeURIComponent(igUserId)}`
    )

  } catch (err) {
    return res.redirect(`/?error=${encodeURIComponent(err.message || 'erreur_serveur')}`)
  }
}
