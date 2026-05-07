export default function handler(req, res) {
  const clientId = process.env.META_APP_ID
  const redirectUri = process.env.META_REDIRECT_URI

  if (!clientId || !redirectUri) {
    return res.status(500).json({ error: 'Variables META_APP_ID ou META_REDIRECT_URI manquantes.' })
  }

  // Instagram API with Instagram Login - scopes business
  const scope = 'instagram_business_basic,instagram_business_manage_insights'

  const authUrl = `https://www.instagram.com/oauth/authorize?enable_fb_login=0&force_authentication=1&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}`

  res.redirect(authUrl)
}
