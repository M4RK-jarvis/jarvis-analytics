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

        {loading && <p style={styles.loading}>Chargement des données...</p>}

        {error && (
          <div style={styles.error}>
            <strong>Erreur :</strong> {error}
          </div>
        )}

        {user && (
          <section style={styles.profileCard}>
            <div style={styles.profileHeader}>
              {user.profile_picture_url && (
                <img src={user.profile_picture_url} alt={user.username} style={styles.avatar} />
              )}
              <div>
                <h2 style={styles.username}>@{user.username}</h2>
                <p style={styles.accountType}>{user.account_type}</p>
                {user.biography && <p style={styles.bio}>{user.biography}</p>}
              </div>
            </div>

            <div style={styles.statsGrid}>
              <div style={styles.statBox}>
                <div style={styles.statValue}>{user.followers_count || 0}</div>
                <div style={styles.statLabel}>Abonnés</div>
              </div>
              <div style={styles.statBox}>
                <div style={styles.statValue}>{user.follows_count || 0}</div>
                <div style={styles.statLabel}>Abonnements</div>
              </div>
              <div style={styles.statBox}>
                <div style={styles.statValue}>{user.media_count || 0}</div>
                <div style={styles.statLabel}>Publications</div>
              </div>
            </div>
          </section>
        )}

        {media.length > 0 && (
          <section style={styles.mediaSection}>
            <h2 style={styles.sectionTitle}>Dernières publications</h2>
            <div style={styles.mediaGrid}>
              {media.map((m) => (
                <a key={m.id} href={m.permalink} target="_blank" rel="noopener noreferrer" style={styles.mediaCard}>
                  <img
                    src={m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url}
                    alt={m.caption || 'Publication'}
                    style={styles.mediaImg}
                  />
                  <div style={styles.mediaStats}>
                    <span>❤️ {m.like_count || 0}</span>
                    <span>💬 {m.comments_count || 0}</span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  card: {
    background: 'white',
    borderRadius: '20px',
    padding: '40px',
    maxWidth: '480px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    textAlign: 'center',
  },
  logoCircle: {
    width: '80px',
    height: '80px',
    margin: '0 auto 20px',
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoEmoji: { fontSize: '40px' },
  title: { fontSize: '32px', margin: '0 0 8px', color: '#1a1a1a' },
  subtitle: { color: '#666', margin: '0 0 24px' },
  error: {
    background: '#fee',
    color: '#c33',
    padding: '12px 16px',
    borderRadius: '12px',
    marginBottom: '20px',
    textAlign: 'left',
    fontSize: '14px',
  },
  connectBtn: {
    width: '100%',
    padding: '16px',
    fontSize: '16px',
    fontWeight: '600',
    color: 'white',
    background: 'linear-gradient(135deg, #f5a623 0%, #e91e63 100%)',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    marginBottom: '24px',
  },
  divider: {
    color: '#999',
    fontSize: '12px',
    fontWeight: '600',
    letterSpacing: '1px',
    margin: '24px 0 16px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    border: '1px solid #ddd',
    borderRadius: '12px',
    marginBottom: '12px',
    boxSizing: 'border-box',
  },
  tokenBtn: {
    width: '100%',
    padding: '14px',
    fontSize: '15px',
    fontWeight: '600',
    color: 'white',
    background: '#1a1a1a',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    marginTop: '4px',
  },
  hint: { color: '#999', fontSize: '12px', marginTop: '16px' },
  dashboard: {
    minHeight: '100vh',
    background: '#f5f7fa',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1200px',
    margin: '0 auto 30px',
  },
  dashTitle: { fontSize: '24px', margin: 0, color: '#1a1a1a' },
  logoutBtn: {
    padding: '10px 20px',
    background: '#1a1a1a',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  loading: { textAlign: 'center', color: '#666', padding: '40px' },
  profileCard: {
    maxWidth: '1200px',
    margin: '0 auto 30px',
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
  },
  profileHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  avatar: { width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' },
  username: { fontSize: '24px', margin: '0 0 4px', color: '#1a1a1a' },
  accountType: { color: '#666', margin: '0 0 8px', fontSize: '14px' },
  bio: { color: '#444', margin: 0, fontSize: '14px' },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: '16px',
  },
  statBox: {
    background: '#f5f7fa',
    padding: '20px',
    borderRadius: '12px',
    textAlign: 'center',
  },
  statValue: { fontSize: '28px', fontWeight: '700', color: '#1a1a1a' },
  statLabel: { color: '#666', fontSize: '13px', marginTop: '4px' },
  mediaSection: { maxWidth: '1200px', margin: '0 auto' },
  sectionTitle: { fontSize: '20px', margin: '0 0 16px', color: '#1a1a1a' },
  mediaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
  },
  mediaCard: {
    background: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
    textDecoration: 'none',
    color: 'inherit',
  },
  mediaImg: { width: '100%', height: '200px', objectFit: 'cover', display: 'block' },
  mediaStats: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px',
    fontSize: '13px',
    color: '#444',
  },
}
