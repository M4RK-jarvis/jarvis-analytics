export default async function handler(req, res) {
  const { token, endpoint } = req.query

  if (!token) {
    return res.status(400).json({ error: 'Token manquant' })
  }

  const base = 'https://graph.facebook.com/v19.0'

  try {
    // 1) Récupère les pages accessibles par l'utilisateur
    const pagesRes = await fetch(
      `${base}/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${encodeURIComponent(token)}`
    )
    const pagesData = await pagesRes.json()

    if (pagesData.error) {
      return res.status(400).json({ error: pagesData.error.message, details: pagesData })
    }

    if (!pagesData.data || !pagesData.data.length) {
      return res.status(400).json({ error: 'Aucune page Facebook trouvée pour ce compte.' })
    }

    // 2) Trouve la première page reliée à un compte Instagram pro
    const pageWithIg = pagesData.data.find(
      (page) => page.instagram_business_account && page.instagram_business_account.id
    )

    if (!pageWithIg) {
      return res.status(400).json({
        error: 'Aucun compte Instagram professionnel relié à une page Facebook trouvée.'
      })
    }

    const igUserId = pageWithIg.instagram_business_account.id
    const pageAccessToken = pageWithIg.access_token

    let url

    switch (endpoint) {
      case 'profile':
        url = `${base}/${igUserId}?fields=id,username,followers_count,media_count,biography,profile_picture_url&access_token=${encodeURIComponent(pageAccessToken)}`
        break

      case 'media':
        url = `${base}/${igUserId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=20&access_token=${encodeURIComponent(pageAccessToken)}`
        break

      case 'insights':
        url = `${base}/${igUserId}/insights?metric=reach,impressions,profile_views,follower_count&period=day&access_token=${encodeURIComponent(pageAccessToken)}`
        break

      case 'audience':
        url = `${base}/${igUserId}/insights?metric=audience_city,audience_country,audience_gender_age&period=lifetime&access_token=${encodeURIComponent(pageAccessToken)}`
        break

      default:
        url = `${base}/${igUserId}?fields=id,username&access_token=${encodeURIComponent(pageAccessToken)}`
    }

    const response = await fetch(url)
    const data = await response.json()

    if (data.error) {
      return res.status(400).json({ error: data.error.message, details: data })
    }

    return res.status(200).json(data)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
