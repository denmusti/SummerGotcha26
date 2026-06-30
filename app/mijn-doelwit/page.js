'use client';
import { useState } from 'react';

const BD = '#0D3B6E', AC = '#00B4D8', RD = '#C0392B', GD = '#F4D03F';
const GR = '#1E8449', OR = '#E67E22', WIT = '#FFFFFF';

export default function MijnDoelwitPage() {
  const [code, setCode] = useState('');
  const [data, setData] = useState(null);
  const [fout, setFout] = useState('');
  const [bezig, setBezig] = useState(false);

  async function zoek() {
    if (!code.trim()) return;
    setBezig(true); setFout(''); setData(null);
    try {
      const res = await fetch('/api/mijn-doelwit', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ toegangscode:code.trim() })
      });
      const json = await res.json();
      if (res.ok) setData(json);
      else setFout('❌ Ongeldige code. Controleer je persoonlijke code.');
    } catch { setFout('Verbindingsfout'); }
    finally { setBezig(false); }
  }

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(180deg,#0a1628,#0d2040)', color:WIT, paddingBottom:60 }}>
      <div style={{ background:`linear-gradient(135deg,${BD},#0a1628)`, borderBottom:`3px solid ${AC}`, padding:'28px 24px', textAlign:'center' }}>
        <div style={{ fontSize:12, letterSpacing:4, color:AC, textTransform:'uppercase', marginBottom:8 }}>🎯 Jouw missie</div>
        <h1 style={{ margin:0, fontSize:'clamp(22px,5vw,36px)', fontWeight:'bold' }}>SUMMER <span style={{color:AC}}>GOTCHA</span> 2026</h1>
        <p style={{ color:'#ffffff55', fontSize:13, margin:'8px 0 0' }}>Voer je persoonlijke code in</p>
      </div>

      <div style={{ maxWidth:480, margin:'40px auto', padding:'0 16px' }}>

        {/* Code invoer */}
        <div style={{ background:`${BD}aa`, border:'1px solid #ffffff22', borderRadius:16, padding:28, marginBottom:24, textAlign:'center' }}>
          <div style={{ fontSize:36, marginBottom:16 }}>🔑</div>
          <input type="text" placeholder="Jouw persoonlijke code" value={code} onChange={e=>setCode(e.target.value)} onKeyDown={e=>e.key==='Enter'&&zoek()}
            style={{ width:'100%', padding:'14px 16px', borderRadius:10, border:`1px solid ${fout?RD:'#ffffff33'}`, background:'#0a1628', color:WIT, fontSize:18, textAlign:'center', letterSpacing:3, boxSizing:'border-box', marginBottom:16, outline:'none' }} />
          {fout && <div style={{ color:RD, fontSize:13, marginBottom:12 }}>{fout}</div>}
          <button onClick={zoek} disabled={bezig||!code.trim()}
            style={{ background:bezig?'#333':AC, color:WIT, border:'none', borderRadius:10, padding:'12px 32px', fontSize:16, fontWeight:'bold', cursor:bezig?'not-allowed':'pointer', width:'100%' }}>
            {bezig?'Zoeken...':'🎯 Toon mijn doelwit'}
          </button>
        </div>

        {data && !data.isAdmin && (
          <div>
            {/* Deelnemer info */}
            <div style={{ background:`${BD}aa`, border:'1px solid #ffffff22', borderRadius:16, padding:20, marginBottom:16, textAlign:'center' }}>
              <div style={{ color:'#ffffff66', fontSize:12, letterSpacing:2, textTransform:'uppercase', marginBottom:4 }}>Welkom</div>
              <div style={{ color:WIT, fontSize:22, fontWeight:'bold' }}>{data.naam}</div>
              <div style={{ marginTop:8 }}>
                <span style={{ background:data.status==='actief'?GR:RD, color:WIT, borderRadius:20, padding:'4px 14px', fontSize:13 }}>
                  {data.status==='actief'?'💚 Actief':'💀 Geëlimineerd'}
                </span>
              </div>
            </div>

            {/* Doelwit of wachten */}
            {data.status==='actief' && !data.spelGestart && (
              <div style={{ background:`${BD}aa`, border:`2px solid ${OR}`, borderRadius:16, padding:28, textAlign:'center', marginBottom:16 }}>
                <div style={{ fontSize:48, marginBottom:12 }}>⏳</div>
                <div style={{ color:OR, fontSize:18, fontWeight:'bold', marginBottom:8 }}>Het spel is nog niet gestart</div>
                <div style={{ color:'#ffffff66', fontSize:14 }}>Je doelwit wordt zichtbaar op:</div>
                <div style={{ color:GD, fontSize:20, fontWeight:'bold', marginTop:8 }}>
                  {new Date(data.doelwitBeschikbaarOp).toLocaleString('nl-BE',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'})}
                </div>
              </div>
            )}

            {data.status==='actief' && data.spelGestart && data.doelwit && (
              <div style={{ background:`linear-gradient(135deg,${BD}cc,#1a0a2ecc)`, border:`2px solid ${RD}`, borderRadius:16, padding:28, boxShadow:`0 0 30px ${RD}33`, marginBottom:16 }}>
                <div style={{ color:RD, fontSize:12, letterSpacing:3, textTransform:'uppercase', marginBottom:16, textAlign:'center' }}>🎯 Jouw doelwit</div>
                <div style={{ width:100, height:120, background:`${RD}33`, borderRadius:10, border:`2px solid ${RD}`, margin:'0 auto 16px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, overflow:'hidden' }}>
                  {data.doelwit.foto_url
                    ? <img src={data.doelwit.foto_url} alt="doelwit" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : '🎯'}
                </div>
                <div style={{ textAlign:'center', marginBottom:16 }}>
                  <div style={{ color:WIT, fontSize:26, fontWeight:'bold', marginBottom:6 }}>{data.doelwit.naam}</div>
                  {data.doelwit.adres && <div style={{ color:'#ffffff88', fontSize:14 }}>📍 {data.doelwit.adres}</div>}
                </div>
                <div style={{ background:'#ffffff11', borderRadius:12, padding:16, fontSize:13, color:'#ffffff88', lineHeight:1.7 }}>
                  <strong style={{color:GD}}>⚠️ Spelregels:</strong><br/>
                  • Enkel geldig met waterpistool<br/>
                  • Jij en je doelwit moeten alleen zijn<br/>
                  • Niet geldig in Café NOBIS of NOBIS The Pool<br/>
                  • Duikbril over de ogen = beschermd
                </div>
              </div>
            )}

            {data.status==='geëlimineerd' && (
              <div style={{ background:`${BD}aa`, border:`1px solid ${RD}`, borderRadius:16, padding:24, textAlign:'center', marginBottom:16 }}>
                <div style={{ fontSize:48, marginBottom:12 }}>💀</div>
                <div style={{ color:RD, fontSize:18, fontWeight:'bold' }}>Je bent geëlimineerd</div>
                <div style={{ color:'#ffffff55', fontSize:13, marginTop:8 }}>Beter geluk volgende keer!</div>
              </div>
            )}

            {/* Kills historiek */}
            {data.kills?.length > 0 && (
              <div style={{ background:`${BD}aa`, border:'1px solid #ffffff22', borderRadius:16, padding:20 }}>
                <div style={{ color:GD, fontSize:13, letterSpacing:2, textTransform:'uppercase', marginBottom:16 }}>🏆 Jouw eliminaties ({data.kills.length})</div>
                {data.kills.map((k,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid #ffffff11' }}>
                    <div style={{ width:36, height:42, background:`${RD}33`, borderRadius:6, border:`1px solid ${RD}`, overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>
                      {k.foto_url?<img src={k.foto_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>:'💀'}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ color:WIT, fontSize:14, fontWeight:'bold' }}>{k.naam}</div>
                      <div style={{ color:'#ffffff44', fontSize:11 }}>{new Date(k.tijdstip).toLocaleString('nl-BE')}</div>
                    </div>
                    <div style={{ color:GD, fontSize:18 }}>💀</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ textAlign:'center', marginTop:32 }}>
          <a href="/" style={{ color:'#ffffff33', fontSize:12, textDecoration:'none' }}>← Terug naar overzicht</a>
        </div>
      </div>
    </div>
  );
}
