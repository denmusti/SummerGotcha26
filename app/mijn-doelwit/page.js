'use client';
import { useState, useEffect } from 'react';

const BD = '#0D3B6E', AC = '#00B4D8', RD = '#C0392B', GD = '#F4D03F';
const GR = '#1E8449', OR = '#E67E22', WIT = '#FFFFFF';

export default function MijnDoelwitPage() {
  const [code, setCode] = useState('');
  const [data, setData] = useState(null);
  const [fout, setFout] = useState('');
  const [bezig, setBezig] = useState(false);

  // Laad automatisch als code in URL staat (admin preview)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get('code');
    const urlForce = params.get('forceGestart') === '1';
    if (urlCode) {
      setCode(urlCode);
      setTimeout(() => zoekMet(urlCode, urlForce), 100);
    }
  }, []);
  const [killcode, setKillcode] = useState('');
  const [killBezig, setKillBezig] = useState(false);
  const [killResultaat, setKillResultaat] = useState(null);
  const [killBevestigd, setKillBevestigd] = useState(false);

  async function zoekMet(codeVal, forceGestart = false) {
    if (!codeVal.trim()) return;
    setBezig(true); setFout(''); setData(null);
    try {
      const res = await fetch('/api/mijn-doelwit', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ toegangscode:codeVal.trim(), forceGestart })
      });
      const json = await res.json();
      if (res.ok) setData(json);
      else setFout('❌ Ongeldige code. Controleer je persoonlijke code.');
    } catch { setFout('Verbindingsfout'); }
    finally { setBezig(false); }
  }

  async function zoek() {
    await zoekMet(code);
  }

  async function controleerKill() {
    if (!killcode.trim()) return;
    setKillBezig(true); setKillResultaat(null);
    try {
      const res = await fetch('/api/deelnemers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actie: 'killcode', killcode: killcode.trim(), toegangscode: code.trim() })
      });
      const json = await res.json();
      if (res.ok) setKillResultaat({ geldig: true, slachtoffer: json.slachtoffer });
      else setKillResultaat({ geldig: false, fout: json.error });
    } catch { setKillResultaat({ geldig: false, fout: 'Verbindingsfout' }); }
    finally { setKillBezig(false); }
  }

  async function bevestigKill() {
    if (!killResultaat?.slachtoffer) return;
    setKillBezig(true);
    try {
      const res = await fetch('/api/deelnemers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actie: 'elimineren',
          id: killResultaat.slachtoffer.id,
          killcode_gebruikt: true,
          toegangscode: code.trim(),
          omschrijving: `Kill geregistreerd via de app`
        })
      });
      if (res.ok) {
        setKillBevestigd(true);
        setKillResultaat(null);
        setKillcode('');
        // Herlaad data
        await zoek();
      }
    } finally { setKillBezig(false); }
  }

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(180deg,#0a1628,#0d2040)', color:WIT, paddingBottom:60 }}>
      <div style={{ background:`linear-gradient(135deg,${BD},#0a1628)`, borderBottom:`3px solid ${AC}`, padding:'28px 24px', textAlign:'center' }}>
        <div style={{ fontSize:12, letterSpacing:4, color:AC, textTransform:'uppercase', marginBottom:8 }}>🎯 Jouw missie</div>
        <h1 style={{ margin:0, fontSize:'clamp(22px,5vw,36px)', fontWeight:'bold' }}>SUMMER <span style={{color:AC}}>GOTCHA</span> 2026</h1>
        <p style={{ color:'#ffffff55', fontSize:13, margin:'8px 0 0' }}>Voer je persoonlijke code in</p>
      </div>

      <div style={{ maxWidth:480, margin:'40px auto', padding:'0 16px' }}>

        {/* Code invoer - verberg na inloggen */}
        {!data && <div style={{ background:`${BD}aa`, border:'1px solid #ffffff22', borderRadius:16, padding:28, marginBottom:24, textAlign:'center' }}>
          <div style={{ fontSize:36, marginBottom:16 }}>🔑</div>
          <input type="text" placeholder="Jouw persoonlijke code" value={code} onChange={e=>setCode(e.target.value)} onKeyDown={e=>e.key==='Enter'&&zoek()}
            style={{ width:'100%', padding:'14px 16px', borderRadius:10, border:`1px solid ${fout?RD:'#ffffff33'}`, background:'#0a1628', color:WIT, fontSize:18, textAlign:'center', letterSpacing:3, boxSizing:'border-box', marginBottom:16, outline:'none' }} />
          {fout && <div style={{ color:RD, fontSize:13, marginBottom:12 }}>{fout}</div>}
          <button onClick={zoek} disabled={bezig||!code.trim()}
            style={{ background:bezig?'#333':AC, color:WIT, border:'none', borderRadius:10, padding:'12px 32px', fontSize:16, fontWeight:'bold', cursor:bezig?'not-allowed':'pointer', width:'100%' }}>
            {bezig?'Zoeken...':'🎯 Toon mijn doelwit'}
          </button>
        </div>}

        {data && !data.isAdmin && (
          <div>
            {/* Deelnemer info */}
            <div style={{ background:`${BD}aa`, border:'1px solid #ffffff22', borderRadius:16, padding:20, marginBottom:16, textAlign:'center' }}>
              <div style={{ color:'#ffffff66', fontSize:12, letterSpacing:2, textTransform:'uppercase', marginBottom:4 }}>Welkom</div>
              <div style={{ color:WIT, fontSize:22, fontWeight:'bold' }}>{data.naam}</div>
              <div style={{ marginTop:8, display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
                <span style={{ background:data.status==='actief'?GR:RD, color:WIT, borderRadius:20, padding:'4px 14px', fontSize:13 }}>
                  {data.status==='actief'?'💚 Actief':'💀 Geëlimineerd'}
                </span>
                <span style={{ background:'#F4D03F22', border:'1px solid #F4D03F', color:'#F4D03F', borderRadius:20, padding:'4px 14px', fontSize:13 }}>
                  🏆 {data.kills?.length || 0} kill{(data.kills?.length || 0) !== 1 ? 's' : ''}
                </span>
              </div>
              {data.killcode && (
                <div style={{ marginTop:14, background:'#0a162888', border:`1px solid ${RD}44`, borderRadius:12, padding:'12px 20px', display:'inline-block' }}>
                  <div style={{ color:'#ffffff55', fontSize:11, letterSpacing:2, textTransform:'uppercase', marginBottom:4 }}>Jouw killcode — geef dit enkel door na eliminatie</div>
                  <div style={{ color:RD, fontSize:28, fontWeight:'bold', letterSpacing:6, fontFamily:'monospace' }}>{data.killcode}</div>
                </div>
              )}
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
                {/* Kill registreren — binnen doelwit kader */}
                {killBevestigd ? (
                  <div style={{ background:'#1E844922', border:'1px solid #1E8449', borderRadius:10, padding:14, marginBottom:16, textAlign:'center' }}>
                    <div style={{ fontSize:32, marginBottom:6 }}>🎉</div>
                    <div style={{ color:'#1E8449', fontWeight:'bold' }}>Kill bevestigd! Je nieuwe doelwit wordt geladen...</div>
                  </div>
                ) : (
                  <div style={{ marginBottom:16 }}>
                    <div style={{ color:RD, fontSize:12, letterSpacing:2, textTransform:'uppercase', marginBottom:10 }}>💀 Kill registreren</div>
                    <div style={{ display:'flex', gap:10, marginBottom:10 }}>
                      <input
                        type="text"
                        placeholder="Killcode slachtoffer"
                        value={killcode}
                        onChange={e => { setKillcode(e.target.value.toUpperCase()); setKillResultaat(null); }}
                        maxLength={6}
                        style={{ flex:1, padding:'10px 14px', borderRadius:8, border:`1px solid ${killResultaat?.geldig===false?RD:'#ffffff33'}`, background:'#0a162888', color:WIT, fontSize:16, textAlign:'center', letterSpacing:4, outline:'none' }}
                      />
                      <button onClick={controleerKill} disabled={killBezig || killcode.length < 4}
                        style={{ background:killBezig?'#333':RD, color:WIT, border:'none', borderRadius:8, padding:'10px 18px', fontSize:14, fontWeight:'bold', cursor:killBezig?'not-allowed':'pointer' }}>
                        {killBezig ? '...' : '💀'}
                      </button>
                    </div>
                    {killResultaat?.geldig && (
                      <div style={{ background:'#1E844922', border:'1px solid #1E8449', borderRadius:10, padding:12, marginBottom:10 }}>
                        <div style={{ color:'#1E8449', fontWeight:'bold', marginBottom:8 }}>✅ {killResultaat.slachtoffer.naam} — bevestig?</div>
                        <button onClick={bevestigKill} disabled={killBezig}
                          style={{ background:RD, color:WIT, border:'none', borderRadius:8, padding:'10px 20px', fontSize:14, fontWeight:'bold', cursor:killBezig?'not-allowed':'pointer', width:'100%' }}>
                          {killBezig ? 'Bezig...' : '💀 Bevestig kill'}
                        </button>
                      </div>
                    )}
                    {killResultaat?.geldig === false && (
                      <div style={{ color:RD, background:'#C0392B22', borderRadius:10, padding:10, fontSize:13, marginBottom:10 }}>❌ {killResultaat.fout}</div>
                    )}
                  </div>
                )}

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
            {(
              <div style={{ background:`${BD}aa`, border:'1px solid #ffffff22', borderRadius:16, padding:20 }}>
                <div style={{ color:GD, fontSize:13, letterSpacing:2, textTransform:'uppercase', marginBottom:16 }}>
                  🏆 Jouw eliminaties ({data.kills?.length || 0})
                </div>
                {data.kills?.length > 0 ? data.kills.map((k,i) => (
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
                )) : (
                  <div style={{ color:'#ffffff33', fontStyle:'italic', textAlign:'center', padding:'16px 0' }}>
                    Nog geen eliminaties — ga op jacht!
                  </div>
                )}
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
