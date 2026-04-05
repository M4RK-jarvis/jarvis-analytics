export default async function handler(req, res) {
  const { token, endpoint, fields } = req.query;

  if (!token) {
    return res.status(400).json({ error: 'Token manquant' });
  }

  try {
    const base = 'https://graph.instagram.com';
    let url;

    switch (endpoint) {
      case 'profile':
        url = `${base}/me?fields=id,username,account_type,followers_count,media_count,profile_picture_url,biography&access_token=${token}`;
        break;
      case 'insights':
        url = `${base}/me/insights?metric=reach,impressions,profile_views,follower_count&period=day&since=${Math.floor(Date.now()/1000) - 30*86400}&until=${Math.floor(Date.now()/1000)}&access_token=${token}`;
        break;
      case 'media':
        url = `${base}/me/media?fields=id,caption,media_type,timestamp,like_count,comments_count,reach,impressions,saved,shares_count,thumbnail_url,media_url,permalink&limit=20&access_token=${token}`;
        break;
      case 'audience':
        url = `${base}/me/insights?metric=audience_country,audience_gender_age,audience_city&period=lifetime&access_token=${token}`;
        break;
      case 'stories':
        url = `${base}/me/stories?fields=id,timestamp,impressions,reach,exits,replies,taps_forward,taps_back&access_token=${token}`;
        break;
      default:
        url = `${base}/me?fields=${fields || 'id,username'}&access_token=${token}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
