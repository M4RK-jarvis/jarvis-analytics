export default function handler(req, res) {
  const clientId = process.env.META_APP_ID
  const redirectUri = process.env.META_REDIRECT_URI

  if (!clientId || !redirectUri) {
    return res.status(500).json({ error: 'Variables d\'environnement META_APP_ID ou META_REDIRECT_URI manquantes.' })
  }

  const scope = 'user_profile,user_media'

  const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&response_type=code`

  res.redirect(authUrl)
}
