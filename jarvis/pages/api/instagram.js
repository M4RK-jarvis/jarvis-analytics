export default async function handler(req, res) {
  const { token, endpoint } = req.query

  if (!token) {
    return res.status(400).json({ error: 'Token manquant' })
  }

  const base = 'https://graph.instagram.com/v19.0'

  try {
    // Récupère l'ig_user_id depuis le token Instagram
    const meRes = await fetch(
      `${base}/me?fields=id,username&access_token=${encodeURIComponent(token)}`
    )
    const meData = await meRes.json()

    if (meData.error) {
      return res.status(400).json({ error: meData.error.message, code: meData.error.code })
    }

    const igUserId = meData.id

    if (!igUserId) {
      return res.status(400).json({ error: 'Impossible de récupérer l\'ID Instagram depuis ce token.' })
    }

    let url

    switch (endpoint) {
      case 'profile':
        url = `${base}/${igUserId}?fields=id,username,followers_count,media_count,biography,profile_picture_url&access_token=${encodeURIComponent(token)}`
        break

      case 'media':
        // like_count et comments_count disponibles sans App Review
        url = `${base}/${igUserId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=20&access_token=${encodeURIComponent(token)}`
        break

      // Ces endpoints nécessitent l'App Review - on les laisse pour préparer la review
      case 'insights':
        url = `${base}/${igUserId}/insights?metric=reach,impressions,profile_views,follower_count&period=day&access_token=${encodeURIComponent(token)}`
        break

      case 'audience':
        url = `${base}/${igUserId}/insights?metric=audience_city,audience_country,audience_gender_age&period=lifetime&access_token=${encodeURIComponent(token)}`
        break

      default:
        url = `${base}/${igUserId}?fields=id,username&access_token=${encodeURIComponent(token)}`
    }

    const response = await fetch(url)
    const data = await response.json()

    if (data.error) {
      // On retourne l'erreur Meta avec le code pour que le frontend puisse adapter l'affichage
      return res.status(400).json({
        error: data.error.message,
        code: data.error.code,
        type: data.error.type,
      })
    }

    return res.status(200).json(data)

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
