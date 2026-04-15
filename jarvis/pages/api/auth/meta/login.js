export default function handler(req, res) {
  const clientId = process.env.META_APP_ID
  const redirectUri = process.env.META_REDIRECT_URI
  const scope = process.env.META_SCOPES

  const url = new URL('https://www.facebook.com/v19.0/dialog/oauth')

  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', scope)
  url.searchParams.set('response_type', 'code')

  res.redirect(url.toString())
}
