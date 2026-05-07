export default function handler(req, res) {
  const clientId = process.env.META_APP_ID
  const redirectUri = process.env.META_REDIRECT_URI

  if (!clientId || !redirectUri) {
    return res.status(500).json({ error: 'Variables META_APP_ID ou META_REDIRECT_URI manquantes.' })
  }

  // Permissions via Facebook Login for Business pour accéder à Instagram Business
  const scope = 'instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement,business_management'

  const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`

  res.redirect(authUrl)
}
