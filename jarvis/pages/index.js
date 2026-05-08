import { useEffect, useState } from 'react'
import Head from 'next/head'

export default function Home() {
  const [token, setToken] = useState('')
  const [igUserId, setIgUserId] = useState('')
  const [user, setUser] = useState(null)
  const [media, setMedia] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [tokenInput, setTokenInput] = useState('')
  const [igIdInput, setIgIdInput] = useState('')

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
      window.history.replaceState({}, document.title, '/')
      loadData(t)
    }
  }, [])

  async function loadData(accessToken) {
    setLoading(true)
    setError('')

    try {
      const userFields = 'user_id,username,name,account_type,profile_picture_url,followers_count,follows_count,media_count,biography'
      const userRes = await fetch(
        `https://graph.instagram.com/v21.0/me?fields=${userFields}&access_token=${accessToken}`
      )
      const userData = await userRes.json()

      if (userData.error) {
        setError(`Profile error: ${userData.error.message}`)
        setLoading(false)
        return
      }

      setUser(userData)

      const mediaFields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count'
      const mediaRes = await fetch(
        `https://graph.instagram.com/v21.0/me/media?fields=${mediaFields}&limit=12&access_token=${accessToken}`
      )
      const mediaData = await mediaRes.json()

      if (mediaData.error) {
        setError(`Media error: ${mediaData.error.message}`)
      } else {
        setMedia(mediaData.data || [])
      }

    } catch (err) {
      setError(err.message || 'Loading error')
    } finally {
      setLoading(false)
    }
  }

  function handleConnect() {
    window.location.href = '/api/auth/meta/login'
  }

  function handleManualConnect() {
    if (!tokenInput || !igIdInput) {
      setError('Please enter both token and Instagram ID')
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
            <p style={styles.subtitle}>Connect your Instagram professional account.</p>

            {error && (
              <div style={styles.error}>
                <strong>Error:</strong> {error}
              </div>
            )}

            <button onClick={handleConnect} style={styles.connectBtn}>
              📸 Connect my Instagram
            </button>

            <div style={styles.divider}>OR DEVELOPER MODE</div>

            <input
              type="text"
              placeholder="Access Token (from Meta Developer)"
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
              Connect with token
            </button>

            <p style={styles.hint}>
              Token available in Meta Developer → Instagram API → Generate access tokens
            </p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Jarvis Analytics — Dashboard</title>
      </Head>
      <div style={styles.dashboard}>
        <header style={styles.header}>
          <h1 style={styles.dashTitle}>📊 Jarvis Analytics</h1>
          <button onClick={handleDisconnect} style={styles.logoutBtn}>
            Log out
          </button>
        </header>

        {loading && <p style={styles.loading}>Loading data...</p>}

        {error && (
          <div style={styles.error}>
            <strong>Error:</strong> {error}
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
                <div style={styles.statLabel}>Followers</div>
              </div>
              <div style={styles.statBox}>
                <div style={styles.statValue}>{user.follows_count || 0}</div>
                <div style={styles.statLabel}>Following</div>
              </div>
              <div style={styles.statBox}>
                <div style={styles.statValue}>{user.media_count || 0}</div>
                <div style={styles.statLabel}>Posts</div>
              </div>
            </div>
          </section>
        )}

        {media.length > 0 && (
          <section style={styles.mediaSection}>
            <h2 style={styles.sectionTitle}>Latest posts</h2>
            <div style={styles.mediaGrid}>
              {media.map((m) => (
                <a key={m.id} href={m.permalink} target="_blank" rel="noopener noreferrer" style={styles.mediaCard}>
                  <img
                    src={m.media_type === 'VIDEO' ? m.thumbnail_url : m.media_url}
                    alt={m.caption || 'Post'}
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
    background: '
