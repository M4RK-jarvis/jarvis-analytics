export default function handler(req, res) {
  const clientId = process.env.META_APP_ID
  const redirectUri = process.env.META_REDIRECT_URI

  if (!clientId || !redirectUri) {
    return res.status(500).json({ error: 'Variables META_APP_ID ou META_REDIRECT_URI manquantes.' })
  }

  // Nouvelle API Instagram :
  // - instagram_business_basic → accès au compte Instagram Business
  // - pages_show_list          → nécessaire pour /me/accounts (trouver la Page liée)
  const scope = 'instagram_business_basic,pages_show_list'

  const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`

  res.redirect(authUrl)
}
