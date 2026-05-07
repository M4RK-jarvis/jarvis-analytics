import { useEffect, useState } from 'react'
import Head from 'next/head'

export default function Home() {
  const [token, setToken] = useState('')
  const [igUserId, setIgUserId] = useState('')
  const [user, setUser] = useState(null)
  const [media, setMedia] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Form inputs (mode développeur)
  const [tokenInput, setTokenInput] = useState('')
  const [igIdInput, setIgIdInput] = useState('')

  // Récupère token + igid depuis l'URL au chargement
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('token')
    const id = params.get('igid')
    const err = params.get('error')

    if (err) {
      setError(decodeURIComponent(err))
      return
    }

    if (t && id) {
      setToken(t)
      setIgUserId(id)
      // Nettoie l'URL pour ne pas exposer le token
      window.history.replaceState({}, document.title, '/')
      loadData(t)
    }
  }, [])

  async function loadData(accessToken) {
    setLoading(true)
    setError('')

    try {
      // 1) Profil utilisateur via Instagram Graph API (nouvelle API)
      const userFields = 'user_id,username,name,account_type,profile_picture_url,followers_count,follows_count,media_count,biography'
      const userRes = await fetch(
        `https://graph.instagram.com/v21.0/me?fields=${userFields}&access_token=${accessToken}`
      )
      const userData = await userRes.json()

      if (userData.error) {
        setError(`Erreur profil : ${userData.error.message}`)
        setLoading(false)
        return
      }

      setUser(userData)

      // 2) Liste des médias (les 12 derniers)
      const mediaFields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count'
      const mediaRes = await fetch(
        `https://graph.instagram.com/v21.0/me/media?fields=${mediaFields}&limit=12&access_token=${accessToken}`
      )
      const mediaData = await mediaRes.json()

      if (mediaData.error) {
        setError(`Erreur médias : ${mediaData.error.message}`)
      } else {
        setMedia(mediaData.data || [])
      }

    } catch (err) {
      setError(err.message || 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  function handleConnect() {
    window.location.href = '/api/auth/meta/login'
  }

  function handleManualConnect() {
    if (!tokenInput || !igIdInput) {
      setError('Renseigne le token et l\'ID Instagram')
      return
    }
    setToken(tokenInput)
    setIgUserId(igIdInput)
    loadData(tokenInput)
  }

  function handleDisconnect() {
    setToken('')
    setIgUserId('')
    setUser(null)
    setMedia([])
    setError('')
  }

  // Si pas connecté : page de login
  if (!token) {
    return (
      <>
        <Head>
          <title>Jarvis Analytics</title>
        </Head>
        <div style={styles.container}>
          <div style={styles.card}>
            <div style={styles.logoCircle}>
              <div style={styles.logoEmoji}>📊</div>
            </div>
            <h1 style={styles.title}>Jarvis</h1>
            <p style={styles.subtitle}>Connecte ton compte Instagram professionnel.</p>

            {error && (
              <div style={styles.error}>
                <strong>Erreur :</strong> {error}
              </div>
            )}

            <button onClick={handleConnect} style={styles.connectBtn}>
              📸 Connecter mon Instagram
            </button>

            <div style={styles.divider}>OU MODE DÉVELOPPEUR</div>

            <input
              type="text"
              placeholder="Access Token (depuis Meta Developer)"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              style={styles.input}
            />
            <input
              type="text"
              placeholder="Instagram User ID (ex: 17841400000000000)"
              value={igIdInput}
              onChange={(e) => setIgIdInput(e.target.value)}
              style={styles.input}
            />
            <button onClick={handleManualConnect} style={styles.tokenBtn}>
              Connecter avec le token
            </button>

            <p style={styles.hint}>
              Token disponible dans Meta Developer → API Instagram → Générez des tokens d'accès
            </p>
          </div>
        </div>
      </>
    )
  }

  // Connecté : dashboard
  return (
    <>
      <Head>
        <title>Jarvis Analytics — Dashboard</title>
      </Head>
      <div style={styles.dashboard}>
        <header style={styles.header}>
          <h1 style={styles.dashTitle}>📊 Jarvis Analytics</h1>
          <button onClick={handleDisconnect} style={styles.logoutBtn}>
            Déconnexion
          </button>
        </header>

        {loadin
