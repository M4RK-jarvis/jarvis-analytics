export default async function handler(req, res) {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const IG_USER_ID = "17841468137938792";

  if (!token) {
    return res.status(500).json({ error: "Missing token" });
  }

  try {
    const url = `https://graph.instagram.com/${IG_USER_ID}/media?fields=id,comments_count&access_token=${encodeURIComponent(token)}`;

    const response = await fetch(url);
    const data = await response.json();

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: "API error", details: error.message });
  }
}
