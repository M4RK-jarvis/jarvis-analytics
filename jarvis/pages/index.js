import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function Home() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    const igidFromUrl = params.get('igid');
    const errorFromUrl = params.get('error');

    window.history.replaceState({}, document.title, '/');

    if (errorFromUrl) {
      const msg = decodeURIComponent(errorFromUrl)
      // Message lisible selon les cas Meta
      if (msg === 'aucun_compte_instagram_business_lie') {
        setError('Aucun compte Instagram professionnel lié à ta Page Facebook. Va dans les paramètres Instagram → Compte → Passer en compte professionnel, puis lie-le à ta Page.')
      } else {
        setError(msg)
      }
      return;
    }

    if (tokenFromUrl && igidFromUrl) {
      const cleanToken = decodeURIComponent(tokenFromUrl).trim()
      const cleanIgid = decodeURIComponent(igidFromUrl).trim()
      localStorage.setItem('jarvis_token', cleanToken)
      localStorage.setItem('jarvis_igid', cleanIgid)
      connectWithToken(cleanToken, cleanIgid)
      return;
    }

    const savedToken = localStorage.getItem('jarvis_token')
    const savedIgid = localStorage.getItem('jarvis_igid')
    if (savedToken && savedIgid) {
      connectWithToken(savedToken.trim(), savedIgid.trim())
    }
  }, []);

  const fmt = (n) => {
    if (!n) return '—';
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  };

  const connectWithToken = async (tokenValue, igidValue) => {
    if (!tokenValue?.trim() || !igidValue?.trim()) return;

    setLoading(true);
    setError('');

    try {
      const t = encodeURIComponent(tokenValue.trim())
      const ig = encodeURIComponent(igidValue.trim())

      const profileRes = await fetch(`/api/instagram?token=${t}&igid=${ig}&endpoint=profile`)
      const profile = await profileRes.json()
      if (profile.error) throw new Error(profile.error)

      const mediaRes = await fetch(`/api/instagram?token=${t}&igid=${ig}&endpoint=media`)
      const media = await mediaRes.json()
      if (media.error) throw new Error(`Médias : ${media.error}`)

      let insights = { data: [], locked: true }
      try {
        const insightsRes = await fetch(`/api/instagram?token=${t}&igid=${ig}&endpoint=insights`)
        const insightsData = await insightsRes.json()
        if (!insightsData.error) {
          insights = { ...insightsData, locked: false }
        }
      } catch { /* insights verrouillés */ }

      let totalLikes = 0, totalComments = 0;
      if (media.data) {
        media.data.forEach(p => {
          totalLikes += p.like_count || 0;
          totalComments += p.comments_count || 0;
        });
      }

      const followers = profile.followers_count || 0;
      const engRate = followers > 0 && media.data?.length > 0
        ? ((totalLikes + totalComments) / (followers * media.data.length) * 100).toFixed(1)
        : null;

      let reach = 0, impressions = 0;
      if (!insights.locked && insights.data) {
        insights.data.forEach(m => {
          if (m.name === 'reach') reach = m.values?.reduce((a, b) => a + (b.value || 0), 0) || 0;
          if (m.name === 'impressions') impressions = m.values?.reduce((a, b) => a + (b.value || 0), 0) || 0;
        });
      }

      setData({
        profile,
        media: media.data || [],
        totalLikes,
        totalComments,
        engRate,
        reach,
        impressions,
        followers,
        insightsLocked: insights.locked,
      });

      localStorage.setItem('jarvis_token', tokenValue.trim())
      localStorage.setItem('jarvis_igid', igidValue.trim())
    } catch (err) {
      setError(err.message || 'Erreur inconnue');
    }

    setLoading(false);
  };

  const connectWithOAuth = () => {
    window.location.href = '/api/auth/meta/login';
  };

  const disconnect = () => {
    setData(null);
    setToken('');
    setError('');
    localStorage.removeItem('jarvis_token');
    localStorage.removeItem('jarvis_igid');
  };

  if (loading) return (
    <div style={styles.center}>
      <Head><title>Jarvis Analytics</title></Head>
      <div style={styles.loader}></div>
      <p style={{ color: '#86868b', marginTop: 16, fontFamily: 'system-ui' }}>Connexion à Instagram...</p>
    </div>
  );

  if (!data) return (
    <div style={styles.center}>
      <Head><title>Jarvis Analytics</title></Head>
      <div style={styles.connectCard}>
        <div style={styles.igIcon}>📊</div>
        <h1 style={styles.title}>Jarvis</h1>
        <p style={styles.sub}>Connecte ton compte Instagram professionnel pour visualiser tes métriques.<br /><strong>Aucune donnée n'est stockée.</strong></p>

        {error && (
          <div style={styles.errorBox}>
            <strong>Erreur :</strong> {error}
          </div>
        )}

        <button style={styles.oauthBtn} onClick={connectWithOAuth}>
          <span style={{ marginRight: 8 }}>📸</span>
          Connecter mon Instagram
        </button>
      </div>
    </div>
  );

  const { profile, media, totalLikes, totalComments, engRate, reach, impressions, followers, insightsLocked } = data;

  return (
    <div style={styles.dash}>
      <Head><title>Jarvis — @{profile.username}</title></Head>

      <nav style={styles.nav}>
        <div style={styles.navBrand}>
          <div style={styles.navLogo}>📊</div>
          <span style={styles.navName}>Jarvis</span>
        </div>
        <div style={styles.navRight}>
          <div style={styles.profileChip}>
            <div style={styles.avatar}>{profile.username?.[0]?.toUpperCase()}</div>
            <span style={styles.handle}>@{profile.username}</span>
          </div>
          <button style={styles.disconnectBtn} onClick={disconnect}>Déconnecter</button>
        </div>
      </nav>

      <div style={styles.content}>
        <div style={styles.pageHeader}>
          <h1 style={styles.pageTitle}>Vue d'ensemble</h1>
          <div style={styles.liveBadge}><span style={styles.liveDot}></span>En direct</div>
        </div>

        {insightsLocked && (
          <div style={styles.reviewNotice}>
            <span style={{ fontSize: 16, marginRight: 8 }}>🔐</span>
            <span>
              <strong>Reach et impressions verrouillés</strong> — Disponibles après la validation Meta App Review.
              Engagement, médias et profil sont actifs.
            </span>
          </div>
        )}

        <div style={styles.kpiGrid}>
          <KPI icon="👥" value={fmt(followers)} label="Abonnés" badge="Disponible" color="#ff2d55" />
          <KPI icon="📊" value={engRate ? engRate + '%' : '—'} label="Taux d'engagement" badge="Disponible" color="#af52de" />
          <KPI icon="👁" value={insightsLocked ? null : fmt(reach)} label="Reach 30j" badge={insightsLocked ? 'App Review requis' : 'Disponible'} color="#0071e3" locked={insightsLocked} />
          <KPI icon="🔥" value={insightsLocked ? null : fmt(impressions)} label="Impressions 30j" badge={insightsLocked ? 'App Review requis' : 'Disponible'} color="#ff9500" locked={insightsLocked} />
        </div>

        <div style={styles.section}>
          <div style={styles.sectionLabel}>Détail engagement</div>
          <div style={styles.card}>
            <EngRow icon="❤️" label="Likes totaux" value={totalLikes.toLocaleString('fr-FR')} pct={82} color="#ff2d55" />
            <EngRow icon="💬" label="Commentaires totaux" value={totalComments.toLocaleString('fr-FR')} pct={38} color="#0071e3" />
            <EngRow icon="📸" label="Posts analysés" value={media.length} pct={100} color="#34c759" />
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionLabel}>Tes derniers posts</div>
          <div style={styles.postsGrid}>
            {media.slice(0, 9).map(post => (
              <a key={post.id} href={post.permalink} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                <div style={styles.postCard}>
                  <div style={styles.postThumb}>
                    {post.thumbnail_url || post.media_url
                      ? <img src={post.thumbnail_url || post.media_url} style={styles.postImg} alt="post" />
                      : <div style={styles.postPlaceholder}>{post.media_type === 'VIDEO' ? '🎬' : '📸'}</div>
                    }
                    <div style={styles.postBadge}>
                      {post.media_type === 'VIDEO' ? 'Reel' : post.media_type === 'CAROUSEL_ALBUM' ? 'Carousel' : 'Photo'}
                    </div>
                  </div>
                  <div style={styles.postStats}>
                    <span>❤️ {fmt(post.like_count)}</span>
                    <span>💬 {fmt(post.comments_count)}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        <div style={styles.infoBox}>
          <strong>💡 Pour débloquer toutes les métriques</strong> (reach, impressions, audience démographique),
          l'app Meta doit passer l'App Review. Les données actuelles (profil, médias, engagement) sont déjà actives.
        </div>
      </div>
    </div>
  );
}

function KPI({ icon, value, label, badge, color, locked }) {
  return (
    <div style={{ ...styles.kpiCard, opacity: locked ? 0.5 : 1 }}>
      <div style={{ ...styles.kpiIcon, background: color + '18' }}>{icon}</div>
      {locked
        ? <div style={styles.kpiLocked}>🔒</div>
        : <div style={styles.kpiValue}>{value}</div>
      }
      <div style={styles.kpiLabel}>{label}</div>
      <span style={{
        ...styles.kpiBadge,
        background: locked ? 'rgba(174,174,178,0.15)' : 'rgba(52,199,89,0.1)',
        color: locked ? '#aeaeb2' : '#1a7a35',
      }}>{badge}</span>
    </div>
  );
}

function EngRow({ icon, label, value, pct, color }) {
  return (
    <div style={styles.engRow}>
      <div style={{ ...styles.engIcon, background: color + '18' }}>{icon}</div>
      <span style={styles.engName}>{label}</span>
      <div style={styles.engBarWrap}>
        <div style={{ ...styles.engBar, width: pct + '%', background: color }}></div>
      </div>
      <span style={styles.engVal}>{value}</span>
    </div>
  );
}

const styles = {
  center: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f2f2f7', flexDirection: 'column' },
  loader: { width: 40, height: 40, border: '3px solid #e5e5ea', borderTopColor: '#0071e3', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  connectCard: { background: '#fff', borderRadius: 24, padding: '48px 40px', maxWidth: 420, width: '100%', boxShadow: '0 4px 40px rgba(0,0,0,0.10)', textAlign: 'center' },
  igIcon: { width: 72, height: 72, borderRadius: 22, background: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 24px', boxShadow: '0 8px 24px rgba(220,39,67,0.35)' },
  title: { fontSize: 28, fontWeight: 800, color: '#1c1c1e', letterSpacing: -0.5, marginBottom: 10, fontFamily: 'system-ui' },
  sub: { fontSize: 15, color: '#86868b', lineHeight: 1.6, marginBottom: 28, fontFamily: 'system-ui' },
  errorBox: { background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.2)', borderRadius: 10, padding: '12px 14px', fontSize: 13, color: '#ff3b30', marginBottom: 16, textAlign: 'left', fontFamily: 'system-ui', lineHeight: 1.5 },
  oauthBtn: { width: '100%', background: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', color: '#fff', border: 'none', borderRadius: 12, padding: '16px', fontFamily: 'system-ui', fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(220,39,67,0.35)' },
  dash: { minHeight: '100vh', background: '#f2f2f7' },
  nav: { background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.08)', position: 'sticky', top: 0, zIndex: 100, padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  navBrand: { display: 'flex', alignItems: 'center', gap: 10 },
  navLogo: { width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(135deg,#f09433,#dc2743,#bc1888)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 },
  navName: { fontSize: 17, fontWeight: 800, color: '#1c1c1e', letterSpacing: -0.3, fontFamily: 'system-ui' },
  navRight: { display: 'flex', alignItems: 'center', gap: 10 },
  profileChip: { display: 'flex', alignItems: 'center', gap: 8, background: '#f2f2f7', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 20, padding: '4px 12px 4px 4px' },
  avatar: { width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#f09433,#dc2743,#bc1888)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', fontFamily: 'system-ui' },
  handle: { fontSize: 13, fontWeight: 600, color: '#1c1c1e', fontFamily: 'system-ui' },
  disconnectBtn: { fontSize: 12, color: '#86868b', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'system-ui', padding: '4px 8px', borderRadius: 6 },
  content: { padding: '24px 24px 80px', maxWidth: 900, margin: '0 auto' },
  pageHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  pageTitle: { fontSize: 28, fontWeight: 800, color: '#1c1c1e', letterSpacing: -0.6, fontFamily: 'system-ui' },
  liveBadge: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: '#1a7a35', background: 'rgba(52,199,89,0.1)', border: '1px solid rgba(52,199,89,0.2)', padding: '5px 12px', borderRadius: 20, fontFamily: 'system-ui' },
  liveDot: { width: 6, height: 6, borderRadius: '50%', background: '#34c759', display: 'inline-block' },
  reviewNotice: { display: 'flex', alignItems: 'flex-start', gap: 8, background: 'rgba(255,159,10,0.08)', border: '1px solid rgba(255,159,10,0.25)', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#3a3a3c', lineHeight: 1.5, marginBottom: 16, fontFamily: 'system-ui' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 20 },
  kpiCard: { background: '#fff', borderRadius: 18, border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', padding: 18, transition: 'opacity 0.2s' },
  kpiIcon: { width: 38, height: 38, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 12 },
  kpiValue: { fontSize: 28, fontWeight: 800, color: '#1c1c1e', letterSpacing: -1, lineHeight: 1, marginBottom: 4, fontFamily: 'system-ui' },
  kpiLocked: { fontSize: 22, marginBottom: 4, lineHeight: 1 },
  kpiLabel: { fontSize: 12, color: '#86868b', fontWeight: 500, marginBottom: 8, fontFamily: 'system-ui' },
  kpiBadge: { display: 'inline-flex', alignItems: 'center', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20, fontFamily: 'system-ui' },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aeaeb2', marginBottom: 10, paddingLeft: 2, fontFamily: 'system-ui' },
  card: { background: '#fff', borderRadius: 18, border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' },
  engRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: '1px solid rgba(0,0,0,0.05)' },
  engIcon: { width: 32, height: 32, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 },
  engName: { fontSize: 13, fontWeight: 500, color: '#3a3a3c', flex: 1, fontFamily: 'system-ui' },
  engBarWrap: { width: 70, height: 5, background: '#f2f2f7', borderRadius: 3, overflow: 'hidden' },
  engBar: { height: '100%', borderRadius: 3 },
  engVal: { fontSize: 13, fontWeight: 700, color: '#1c1c1e', width: 60, textAlign: 'right', fontFamily: 'system-ui' },
  postsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 },
  postCard: { background: '#fff', borderRadius: 14, border: '1px solid rgba(0,0,0,0.07)', overflow: 'hidden' },
  postThumb: { aspectRatio: 1, position: 'relative', background: '#f2f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  postImg: { width: '100%', height: '100%', objectFit: 'cover' },
  postPlaceholder: { fontSize: 32 },
  postBadge: { position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', borderRadius: 6, padding: '2px 6px', fontSize: 9, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'system-ui' },
  postStats: { display: 'flex', justifyContent: 'space-around', padding: '8px 4px', fontSize: 12, fontFamily: 'system-ui', color: '#3a3a3c', fontWeight: 600 },
  infoBox: { background: 'rgba(0,113,227,0.06)', border: '1px solid rgba(0,113,227,0.15)', borderRadius: 14, padding: '14px 18px', fontSize: 13, color: '#3a3a3c', lineHeight: 1.6, fontFamily: 'system-ui' },
};
