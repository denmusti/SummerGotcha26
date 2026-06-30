'use client';
import { useState } from 'react';

const BLAUW_DONKER = '#0D3B6E';
const ACCENT = '#00B4D8';
const ROOD = '#C0392B';
const GOUD = '#F4D03F';
const WIT = '#FFFFFF';

export default function MijnDoelwitPage() {
  const [code, setCode] = useState('');
  const [data, setData] = useState(null);
  const [fout, setFout] = useState('');
  const [bezig, setBezig] = useState(false);

  async function zoek() {
    if (!code.trim()) return;
    setBezig(true);
    setFout('');
    setData(null);
    try {
      const res = await fetch('/api/mijn-doelwit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toegangscode: code.trim() })
      });
      const json = await res.json();
      if (res.ok) setData(json);
      else setFout('❌ Ongeldige code. Controleer je persoonlijke code.');
    } catch {
      setFout('Verbindingsfout');
    } finally {
      setBezig(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0a1628 0%, #0d2040 100%)', color: WIT, padding: '0 0 60px' }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${BLAUW_DONKER}, #0a1628)`, borderBottom: `3px solid ${ACCENT}`, padding: '28px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 12, letterSpacing: 4, color: ACCENT, textTransform: 'uppercase', marginBottom: 8 }}>🎯 Jouw missie</div>
        <h1 style={{ margin: 0, fontSize: 'clamp(22px, 5vw, 36px)', fontWeight: 'bold' }}>
          SUMMER <span style={{ color: ACCENT }}>GOTCHA</span> 2026
        </h1>
        <p style={{ color: '#ffffff55', fontSize: 13, margin: '8px 0 0' }}>Voer je persoonlijke code in om je doelwit te zien</p>
      </div>

      <div style={{ maxWidth: 480, margin: '40px auto', padding: '0 16px' }}>
        {/* Code invoer */}
        <div style={{ background: `${BLAUW_DONKER}aa`, border: '1px solid #ffffff22', borderRadius: 16, padding: 28, marginBottom: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>🔑</div>
          <input
            type="text"
            placeholder="Jouw persoonlijke code"
            value={code}
            onChange={e => setCode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && zoek()}
            style={{ width: '100%', padding: '14px 16px', borderRadius: 10, border: `1px solid ${fout ? ROOD : '#ffffff33'}`, background: '#0a1628', color: WIT, fontSize: 18, textAlign: 'center', letterSpacing: 3, boxSizing: 'border-box', marginBottom: 16, outline: 'none' }}
          />
          {fout && <div style={{ color: ROOD, fontSize: 13, marginBottom: 12 }}>{fout}</div>}
          <button onClick={zoek} disabled={bezig || !code.trim()}
            style={{ background: bezig ? '#333' : ACCENT, color: WIT, border: 'none', borderRadius: 10, padding: '12px 32px', fontSize: 16, fontWeight: 'bold', cursor: bezig ? 'not-allowed' : 'pointer', width: '100%' }}>
            {bezig ? 'Zoeken...' : '🎯 Toon mijn doelwit'}
          </button>
        </div>

        {/* Resultaat */}
        {data && (
          <div>
            <div style={{ background: `${BLAUW_DONKER}aa`, border: '1px solid #ffffff22', borderRadius: 16, padding: 24, marginBottom: 16, textAlign: 'center' }}>
              <div style={{ color: '#ffffff66', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>Welkom</div>
              <div style={{ color: WIT, fontSize: 22, fontWeight: 'bold' }}>{data.naam}</div>
              <div style={{ marginTop: 8 }}>
                <span style={{ background: data.status === 'actief' ? '#1E8449' : ROOD, color: WIT, borderRadius: 20, padding: '4px 14px', fontSize: 13 }}>
                  {data.status === 'actief' ? '💚 Actief' : '💀 Geëlimineerd'}
                </span>
              </div>
            </div>

            {data.status === 'actief' && data.doelwit ? (
              <div style={{ background: `linear-gradient(135deg, ${BLAUW_DONKER}cc, #1a0a2ecc)`, border: `2px solid ${ROOD}`, borderRadius: 16, padding: 28, boxShadow: `0 0 30px ${ROOD}33` }}>
                <div style={{ color: ROOD, fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16, textAlign: 'center' }}>
                  🎯 Jouw doelwit
                </div>

                {/* Foto placeholder */}
                <div style={{ width: 100, height: 120, background: `${ROOD}33`, borderRadius: 10, border: `2px solid ${ROOD}`, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
                  {data.doelwit.foto ? (
                    <img src={data.doelwit.foto} alt="doelwit" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                  ) : '🎯'}
                </div>

                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <div style={{ color: WIT, fontSize: 26, fontWeight: 'bold', marginBottom: 8 }}>{data.doelwit.naam}</div>
                  {data.doelwit.adres && (
                    <div style={{ color: '#ffffff88', fontSize: 14 }}>📍 {data.doelwit.adres}</div>
                  )}
                </div>

                <div style={{ background: '#ffffff11', borderRadius: 12, padding: 16, fontSize: 13, color: '#ffffff88', lineHeight: 1.6 }}>
                  <strong style={{ color: GOUD }}>⚠️ Spelregels:</strong><br />
                  • Enkel geldig met waterpistool<br />
                  • Jij en je doelwit moeten alleen zijn<br />
                  • Niet geldig in Café NOBIS of NOBIS The Pool<br />
                  • Duikbril over de ogen = beschermd
                </div>
              </div>
            ) : data.status === 'actief' && !data.doelwit ? (
              <div style={{ background: `${BLAUW_DONKER}aa`, border: '1px solid #ffffff22', borderRadius: 16, padding: 24, textAlign: 'center' }}>
                <div style={{ color: '#ffffff55', fontStyle: 'italic' }}>De loting is nog niet gegenereerd. Kom later terug!</div>
              </div>
            ) : (
              <div style={{ background: `${BLAUW_DONKER}aa`, border: `1px solid ${ROOD}`, borderRadius: 16, padding: 24, textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>💀</div>
                <div style={{ color: ROOD, fontSize: 18, fontWeight: 'bold' }}>Je bent geëlimineerd</div>
                <div style={{ color: '#ffffff55', fontSize: 13, marginTop: 8 }}>Beter geluk volgende keer!</div>
              </div>
            )}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <a href="/" style={{ color: '#ffffff33', fontSize: 12, textDecoration: 'none' }}>← Terug naar overzicht</a>
        </div>
      </div>
    </div>
  );
}
