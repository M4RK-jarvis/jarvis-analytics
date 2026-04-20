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
    const savedToken = localStorage.getItem('jarvis_token');

    if (tokenFromUrl) {
      const cleanToken = tokenFromUrl.trim();
      setToken(cleanToken);
      localStorage.setItem('jarvis_token', cleanToken);
      window.history.replaceState({}, document.title, '/');
      connectWithToken(cleanToken);
      return;
    }

    if (savedToken) {
      const cleanToken = savedToken.trim();
      setToken(cleanToken);
      connectWithToken(cleanToken);
    }
  }, []);
  

  const fmt = (n) => {
    if (!n) return '—';
    if (n >= 1000000) return (n/1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n/1000).toFixed(1) + 'K';
    return n.toString();
  };

  const connectWithToken = async (tokenValue) => {
  if (!tokenValue?.trim()) return;

  setLoading(true);
  setError('');

  try {
    const safeToken = tokenValue.trim();

    const profileRes = await fetch(`/api/instagram?token=${encodeURIComponent(safeToken)}&endpoint=profile`);
    const profile = await profileRes.json();
    if (profile.error) throw new Error(profile.error);

    const mediaRes = await fetch(`/api/instagram?token=${encodeURIComponent(safeToken)}&endpoint=media`);
const media = await mediaRes.json();
if (media.error) throw new Error(`media: ${media.error}`);

const insightsRes = await fetch(`/api/instagram?token=${encodeURIComponent(safeToken)}&endpoint=insights`);
const insights = await insightsRes.json();
if (insights.error) throw new Error(`insights: ${insights.error}`);

    let totalLikes = 0, totalComments = 0, totalSaves = 0;
    if (media.data) {
      media.data.forEach(p => {
        totalLikes += p.like_count || 0;
        totalComments += p.comments_count || 0;
        totalSaves += p.saved || 0;
      });
    }

    const followers = profile.followers_count || 0;
    const engRate = followers > 0 && media.data?.length > 0
      ? ((totalLikes + totalComments) / (followers * media.data.length) * 100).toFixed(1)
      : '—';

    let reach = 0, impressions = 0;
    if (insights.data) {
      insights.data.forEach(m => {
        if (m.name === 'reach') reach = m.values?.reduce((a,b) => a + (b.value || 0), 0) || 0;
        if (m.name === 'impressions') impressions = m.values?.reduce((a,b) => a + (b.value || 0), 0) || 0;
      });
    }

    setData({
      profile,
      media: media.data || [],
      totalLikes,
      totalComments,
      totalSaves,
      engRate,
      reach,
      impressions,
      followers
    });

    localStorage.setItem('jarvis_token', safeToken);
  } catch (err) {
  setError(err.message || 'Erreur inconnue');
}

  setLoading(false);
};

const connect = async () => {
  await connectWithToken(token);
};
  const disconnect = () => {
    setData(null);
    setToken('');
    localStorage.removeItem('jarvis_token');
  };

  if (loading) return (
    <div style={styles.center}>
      <div style={styles.loader}></div>
      <p style={{color:'#86868b',marginTop:16,fontFamily:'system-ui'}}>Connexion à Instagram...</p>
    </div>
  );

  if (!data) return (
    <div style={styles.center}>
      <Head><title>Jarvis Analytics</title></Head>
      <div style={styles.connectCard}>
        <div style={styles.igIcon}>📊</div>
        <h1 style={styles.title}>Jarvis</h1>
        <p style={styles.sub}>Connecte ton Instagram pour voir toutes tes métriques en temps réel.<br/><strong>Aucune donnée n'est stockée.</strong></p>

        <div style={styles.steps}>
          <p style={styles.stepsLabel}>COMMENT OBTENIR TON TOKEN</p>
          <div style={styles.stepRow}><span style={styles.stepNum}>1</span><span style={styles.stepText}>Va dans ton app Meta Developer → Configuration de l'API Instagram</span></div>
          <div style={styles.stepRow}><span style={styles.stepNum}>2</span><span style={styles.stepText}>Clique sur "Générer un token" à côté de ton compte</span></div>
          <div style={styles.stepRow}><span style={styles.stepNum}>3</span><span style={styles.stepText}>Copie le token et colle-le ici</span></div>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <input
          style={styles.input}
          placeholder="Colle ton token Instagram ici..."
          value={token}
          onChange={e => setToken(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && connect()}
        />
        <button
  style={styles.connectBtn}
  onClick={() => window.location.href = '/api/auth/meta/login'}
>
  🚀 Connecter mon Instagram
</button>
      </div>
    </div>
  );

  const { profile, media, totalLikes, totalComments, totalSaves, engRate, reach, impressions, followers } = data;

  return (
    <div style={styles.dash}>
      <Head><title>Jarvis — @{profile.username}</title></Head>

      {/* TOP NAV */}
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

        {/* KPI GRID */}
        <div style={styles.kpiGrid}>
          <KPI icon="👥" value={fmt(followers)} label="Abonnés" delta="Compte vérifié" color="#ff2d55"/>
          <KPI icon="👁" value={fmt(reach)} label="Reach (30j)" delta="Données réelles" color="#0071e3"/>
          <KPI icon="💜" value={engRate + '%'} label="Engagement" delta="Par post" color="#af52de"/>
          <KPI icon="🔥" value={fmt(impressions)} label="Impressions (30j)" delta="Total" color="#ff9500"/>
        </div>

        {/* ENGAGEMENT DETAIL */}
        <div style={styles.section}>
          <div style={styles.sectionLabel}>Détail engagement</div>
          <div style={styles.card}>
            <EngRow icon="❤️" label="Likes" value={totalLikes.toLocaleString('fr-FR')} pct={82} color="#ff2d55"/>
            <EngRow icon="💬" label="Commentaires" value={totalComments.toLocaleString('fr-FR')} pct={38} color="#0071e3"/>
            <EngRow icon="🔖" label="Sauvegardes" value={totalSaves.toLocaleString('fr-FR')} pct={55} color="#af52de"/>
            <EngRow icon="📊" label="Posts analysés" value={media.length} pct={100} color="#34c759"/>
          </div>
        </div>

        {/* TOP POSTS */}
        <div style={styles.section}>
          <div style={styles.sectionLabel}>Tes derniers posts</div>
          <div style={styles.postsGrid}>
            {media.slice(0, 6).map(post => (
              <div key={post.id} style={styles.postCard}>
                <div style={styles.postThumb}>
                  {post.thumbnail_url || post.media_url
                    ? <img src={post.thumbnail_url || post.media_url} style={styles.postImg} alt="post"/>
                    : <div style={styles.postPlaceholder}>{post.media_type === 'VIDEO' ? '🎬' : '📸'}</div>
                  }
                  <div style={styles.postBadge}>{post.media_type === 'VIDEO' ? 'Reel' : post.media_type === 'CAROUSEL_ALBUM' ? 'Carousel' : 'Photo'}</div>
                </div>
                <div style={styles.postStats}>
                  <span>❤️ {fmt(post.like_count)}</span>
                  <span>💬 {fmt(post.comments_count)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* INFO */}
        <div style={styles.infoBox}>
          <strong>💡 Pour débloquer toutes les métriques</strong> (reach, impressions, stories, audience démographique), ton app Meta doit passer le Contrôle App. Les données actuelles sont celles disponibles en mode développement.
        </div>
      </div>
    </div>
  );
}

function KPI({ icon, value, label, delta, color }) {
  return (
    <div style={styles.kpiCard}>
      <div style={{...styles.kpiIcon, background: color + '18'}}>{icon}</div>
      <div style={styles.kpiValue}>{value}</div>
      <div style={styles.kpiLabel}>{label}</div>
      <span style={styles.kpiBadge}>{delta}</span>
    </div>
  );
}

function EngRow({ icon, label, value, pct, color }) {
  return (
    <div style={styles.engRow}>
      <div style={{...styles.engIcon, background: color + '18'}}>{icon}</div>
      <span style={styles.engName}>{label}</span>
      <div style={styles.engBarWrap}>
        <div style={{...styles.engBar, width: pct + '%', background: color}}></div>
      </div>
      <span style={styles.engVal}>{value}</span>
    </div>
  );
}

const styles = {
  center: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f2f2f7', flexDirection:'column' },
  loader: { width:40, height:40, border:'3px solid #e5e5ea', borderTopColor:'#0071e3', borderRadius:'50%', animation:'spin 0.8s linear infinite' },
  connectCard: { background:'#fff', borderRadius:24, padding:'48px 40px', maxWidth:460, width:'100%', boxShadow:'0 4px 40px rgba(0,0,0,0.10)', textAlign:'center' },
  igIcon: { width:72, height:72, borderRadius:22, background:'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, margin:'0 auto 24px', boxShadow:'0 8px 24px rgba(220,39,67,0.35)' },
  title: { fontSize:28, fontWeight:800, color:'#1c1c1e', letterSpacing:-0.5, marginBottom:10, fontFamily:'system-ui' },
  sub: { fontSize:15, color:'#86868b', lineHeight:1.6, marginBottom:24, fontFamily:'system-ui' },
  steps: { background:'#f2f2f7', borderRadius:14, padding:20, marginBottom:24, textAlign:'left', border:'1px solid rgba(0,0,0,0.07)' },
  stepsLabel: { fontSize:10, fontWeight:700, letterSpacing:'0.1em', color:'#aeaeb2', marginBottom:14, fontFamily:'system-ui' },
  stepRow: { display:'flex', gap:12, marginBottom:12, alignItems:'flex-start' },
  stepNum: { width:22, height:22, borderRadius:'50%', background:'#0071e3', color:'#fff', fontSize:11, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontFamily:'system-ui' },
  stepText: { fontSize:13, color:'#3a3a3c', lineHeight:1.5, fontFamily:'system-ui' },
  errorBox: { background:'rgba(255,59,48,0.08)', border:'1px solid rgba(255,59,48,0.2)', borderRadius:10, padding:'10px 14px', fontSize:13, color:'#ff3b30', marginBottom:14, fontFamily:'system-ui' },
  input: { width:'100%', background:'#f2f2f7', border:'1.5px solid rgba(0,0,0,0.13)', borderRadius:10, padding:'14px 16px', fontFamily:'system-ui', fontSize:14, color:'#1c1c1e', outline:'none', marginBottom:14, boxSizing:'border-box' },
  connectBtn: { width:'100%', background:'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', color:'#fff', border:'none', borderRadius:10, padding:15, fontFamily:'system-ui', fontSize:15, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 20px rgba(220,39,67,0.35)' },
  dash: { minHeight:'100vh', background:'#f2f2f7' },
  nav: { background:'rgba(255,255,255,0.85)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(0,0,0,0.08)', position:'sticky', top:0, zIndex:100, padding:'0 24px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between' },
  navBrand: { display:'flex', alignItems:'center', gap:10 },
  navLogo: { width:30, height:30, borderRadius:9, background:'linear-gradient(135deg,#f09433,#dc2743,#bc1888)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 },
  navName: { fontSize:17, fontWeight:800, color:'#1c1c1e', letterSpacing:-0.3, fontFamily:'system-ui' },
  navRight: { display:'flex', alignItems:'center', gap:10 },
  profileChip: { display:'flex', alignItems:'center', gap:8, background:'#f2f2f7', border:'1px solid rgba(0,0,0,0.08)', borderRadius:20, padding:'4px 12px 4px 4px' },
  avatar: { width:28, height:28, borderRadius:'50%', background:'linear-gradient(135deg,#f09433,#dc2743,#bc1888)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff', fontFamily:'system-ui' },
  handle: { fontSize:13, fontWeight:600, color:'#1c1c1e', fontFamily:'system-ui' },
  disconnectBtn: { fontSize:12, color:'#86868b', background:'none', border:'none', cursor:'pointer', fontFamily:'system-ui', padding:'4px 8px', borderRadius:6 },
  content: { padding:'24px 24px 80px', maxWidth:900, margin:'0 auto' },
  pageHeader: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 },
  pageTitle: { fontSize:28, fontWeight:800, color:'#1c1c1e', letterSpacing:-0.6, fontFamily:'system-ui' },
  liveBadge: { display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:500, color:'#1a7a35', background:'rgba(52,199,89,0.1)', border:'1px solid rgba(52,199,89,0.2)', padding:'5px 12px', borderRadius:20, fontFamily:'system-ui' },
  liveDot: { width:6, height:6, borderRadius:'50%', background:'#34c759', display:'inline-block' },
  kpiGrid: { display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12, marginBottom:20 },
  kpiCard: { background:'#fff', borderRadius:18, border:'1px solid rgba(0,0,0,0.07)', boxShadow:'0 1px 3px rgba(0,0,0,0.06)', padding:18 },
  kpiIcon: { width:38, height:38, borderRadius:11, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, marginBottom:12 },
  kpiValue: { fontSize:28, fontWeight:800, color:'#1c1c1e', letterSpacing:-1, lineHeight:1, marginBottom:4, fontFamily:'system-ui' },
  kpiLabel: { fontSize:12, color:'#86868b', fontWeight:500, marginBottom:8, fontFamily:'system-ui' },
  kpiBadge: { display:'inline-flex', alignItems:'center', fontSize:11, fontWeight:700, padding:'3px 8px', borderRadius:20, background:'rgba(52,199,89,0.1)', color:'#1a7a35', fontFamily:'system-ui' },
  section: { marginBottom:20 },
  sectionLabel: { fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'#aeaeb2', marginBottom:10, paddingLeft:2, fontFamily:'system-ui' },
  card: { background:'#fff', borderRadius:18, border:'1px solid rgba(0,0,0,0.07)', boxShadow:'0 1px 3px rgba(0,0,0,0.06)', overflow:'hidden' },
  engRow: { display:'flex', alignItems:'center', gap:12, padding:'10px 18px', borderBottom:'1px solid rgba(0,0,0,0.07)' },
  engIcon: { width:32, height:32, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 },
  engName: { fontSize:13, fontWeight:500, color:'#3a3a3c', flex:1, fontFamily:'system-ui' },
  engBarWrap: { width:70, height:5, background:'#f2f2f7', borderRadius:3, overflow:'hidden' },
  engBar: { height:'100%', borderRadius:3 },
  engVal: { fontSize:13, fontWeight:700, color:'#1c1c1e', width:60, textAlign:'right', fontFamily:'system-ui' },
  postsGrid: { display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 },
  postCard: { background:'#fff', borderRadius:14, border:'1px solid rgba(0,0,0,0.07)', overflow:'hidden' },
  postThumb: { aspectRatio:1, position:'relative', background:'#f2f2f7', display:'flex', alignItems:'center', justifyContent:'center' },
  postImg: { width:'100%', height:'100%', objectFit:'cover' },
  postPlaceholder: { fontSize:32 },
  postBadge: { position:'absolute', top:6, right:6, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', borderRadius:6, padding:'2px 6px', fontSize:9, fontWeight:700, color:'#fff', textTransform:'uppercase', letterSpacing:'0.05em', fontFamily:'system-ui' },
  postStats: { display:'flex', justifyContent:'space-around', padding:'8px 4px', fontSize:12, fontFamily:'system-ui', color:'#3a3a3c', fontWeight:600 },
  infoBox: { background:'rgba(0,113,227,0.06)', border:'1px solid rgba(0,113,227,0.15)', borderRadius:14, padding:'14px 18px', fontSize:13, color:'#3a3a3c', lineHeight:1.6, fontFamily:'system-ui' },
};
