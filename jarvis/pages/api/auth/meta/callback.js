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
    // 1) Échange du code contre un user access token (nouvelle API → Facebook Graph)
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`
    )
    const tokenData = await tokenRes.json()

    if (tokenData.error) {
      return res.redirect(`/?error=${encodeURIComponent(tokenData.error.message || 'token_invalide')}`)
    }

    const userToken = tokenData.access_token

    if (!userToken) {
      return res.redirect('/?error=token_manquant')
    }

    // 2) Récupère les Pages Facebook et leur compte Instagram Business lié
    const pagesRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${userToken}`
    )
    const pagesData = await pagesRes.json()

    if (pagesData.error) {
      return res.redirect(`/?error=${encodeURIComponent(pagesData.error.message)}`)
    }

    // Trouve la première Page avec un compte Instagram Business lié
    const pages = pagesData.data || []
    const linkedPage = pages.find(p => p.instagram_business_account?.id)

    if (!linkedPage) {
      return res.redirect('/?error=aucun_compte_instagram_business_lie')
    }

    const igBusinessId = linkedPage.instagram_business_account.id
    const pageToken = linkedPage.access_token // token de la Page (recommandé pour les appels IG)

    // 3) Redirige vers le dashboard avec le token et l'ID IG Business
    return res.redirect(
      `/?token=${encodeURIComponent(pageToken)}&igid=${encodeURIComponent(igBusinessId)}`
    )

  } catch (err) {
    return res.redirect(`/?error=${encodeURIComponent(err.message || 'erreur_serveur')}`)
  }
}
