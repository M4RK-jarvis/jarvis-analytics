export default async function handler(req, res) {
  const { token, igid, endpoint } = req.query

  if (!token || !igid) {
    return res.status(400).json({ error: 'Token ou ID Instagram Business manquant.' })
  }

  const base = 'https://graph.facebook.com/v19.0'

  try {
    let url

    switch (endpoint) {
      case 'profile':
        url = `${base}/${igid}?fields=id,username,followers_count,media_count,biography,profile_picture_url&access_token=${encodeURIComponent(token)}`
        break

      case 'media':
        url = `${base}/${igid}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count&limit=20&access_token=${encodeURIComponent(token)}`
        break

      case 'insights':
        // Nécessite instagram_business_manage_insights + App Review
        url = `${base}/${igid}/insights?metric=reach,impressions,profile_views&period=day&access_token=${encodeURIComponent(token)}`
        break

      case 'audience':
        // Nécessite App Review
        url = `${base}/${igid}/insights?metric=audience_city,audience_country,audience_gender_age&period=lifetime&access_token=${encodeURIComponent(token)}`
        break

      default:
        url = `${base}/${igid}?fields=id,username&access_token=${encodeURIComponent(token)}`
    }

    const response = await fetch(url)
    const data = await response.json()

    if (data.error) {
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
