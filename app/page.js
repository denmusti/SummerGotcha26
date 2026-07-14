'use client';
import { useState, useEffect } from 'react';

const BLAUW = '#1A6B9E';
const BLAUW_DONKER = '#0D3B6E';
const ACCENT = '#00B4D8';
const ROOD = '#C0392B';
const GOUD = '#F4D03F';
const WIT = '#FFFFFF';

function Afteltimer({ eindDatum, startDatum }) {
  const [tijd, setTijd] = useState('');
  const [fase, setFase] = useState('');

  useEffect(() => {
    function bereken() {
      const nu = new Date();
      const start = new Date(startDatum);
      const eind = new Date(eindDatum);

      if (nu < start) {
        const diff = start - nu;
        const d = Math.floor(diff / 86400000);
        const u = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setFase('start');
        setTijd(`${d}d ${u}u ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`);
      } else if (nu > eind) {
        setFase('einde');
        setTijd('Het spel is afgelopen!');
      } else {
        const diff = eind - nu;
        const d = Math.floor(diff / 86400000);
        const u = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setFase('actief');
        setTijd(`${d}d ${u}u ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`);
      }
    }
    bereken();
    const interval = setInterval(bereken, 1000);
    return () => clearInterval(interval);
  }, [eindDatum, startDatum]);

  const kleur = fase === 'actief' ? GOUD : fase === 'start' ? ACCENT : ROOD;
  const label = fase === 'start' ? '⏳ Start over' : fase === 'actief' ? '💀 Tijd resterend' : '🏆';

  return (
    <div style={{
      background: `linear-gradient(135deg, ${BLAUW_DONKER}, #1a0a2e)`,
      border: `2px solid ${kleur}`,
      borderRadius: 16,
      padding: '24px 32px',
      textAlign: 'center',
      marginBottom: 32,
      boxShadow: `0 0 30px ${kleur}44`
    }}>
      <div style={{ color: kleur, fontSize: 13, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
      <div style={{ color: kleur, fontSize: 48, fontWeight: 'bold', letterSpacing: 4, fontVariantNumeric: 'tabular-nums' }}>{tijd}</div>
      <div style={{ color: '#ffffff66', fontSize: 12, marginTop: 8 }}>
        12 juli 2026 — 20 september 2026
      </div>
    </div>
  );
}

function StatKaart({ waarde, label, kleur, icon }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${BLAUW_DONKER}cc, #0a1628cc)`,
      border: `2px solid ${kleur}`,
      borderRadius: 16,
      padding: '28px 20px',
      textAlign: 'center',
      flex: 1,
      minWidth: 140,
      boxShadow: `0 0 20px ${kleur}33`,
      transition: 'transform 0.2s',
    }}>
      <div style={{ fontSize: 36, marginBottom: 8 }}>{icon}</div>
      <div style={{ color: kleur, fontSize: 52, fontWeight: 'bold', lineHeight: 1 }}>{waarde}</div>
      <div style={{ color: '#ffffff88', fontSize: 13, marginTop: 10, letterSpacing: 1, textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
}

function TijdlijnItem({ item }) {
  const datum = new Date(item.tijdstip);
  const geleden = () => {
    const diff = Date.now() - datum.getTime();
    const m = Math.floor(diff / 60000);
    const u = Math.floor(m / 60);
    const d = Math.floor(u / 24);
    if (d > 0) return `${d} dag${d > 1 ? 'en' : ''} geleden`;
    if (u > 0) return `${u} uur geleden`;
    if (m > 0) return `${m} min geleden`;
    return 'zojuist';
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      padding: '14px 0',
      borderBottom: '1px solid #ffffff11',
    }}>
      <div style={{
        width: 48, height: 56, borderRadius: 8, overflow: 'hidden', flexShrink: 0,
        background: `linear-gradient(135deg, ${ROOD}44, ${BLAUW_DONKER})`,
        border: `1px solid ${ROOD}66`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22
      }}>
        {item.foto_url
          ? <img src={item.foto_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : '🔫'}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: WIT, fontSize: 15, fontWeight: item.tekst.includes('uitgeschakeld') ? 'bold' : 'normal' }}>{item.tekst}</div>
        <div style={{ color: '#ffffff44', fontSize: 12, marginTop: 4 }}>{geleden()}</div>
      </div>
    </div>
  );
}

export default function PubliekePage() {
  const [data, setData] = useState(null);
  const [laden, setLaden] = useState(true);

  async function laadData() {
    try {
      const res = await fetch('/api/data', { cache: 'no-store' });
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLaden(false);
    }
  }

  useEffect(() => {
    laadData();
    const interval = setInterval(laadData, 30000); // refresh elke 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a1628 0%, #0d2040 100%)',
      color: WIT,
      padding: '0 0 60px',
    }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${BLAUW_DONKER}, #0a1628)`,
        borderBottom: `3px solid ${ACCENT}`,
        padding: '32px 24px 24px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 13, letterSpacing: 4, color: ACCENT, textTransform: 'uppercase', marginBottom: 8 }}>
          ⚡ Officieel opvolgingssysteem
        </div>
        <h1 style={{ margin: 0, fontSize: 'clamp(28px, 6vw, 52px)', fontWeight: 'bold', letterSpacing: 2 }}>
          SUMMER <span style={{ color: ACCENT }}>GOTCHA</span> 2026
        </h1>
        <div style={{ color: '#ffffff66', fontSize: 14, marginTop: 8 }}>
          🔫 Wie overleeft de zomer?
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 16px' }}>

        {laden ? (
          <div style={{ textAlign: 'center', color: '#ffffff44', padding: 60 }}>Laden...</div>
        ) : data ? (
          <>
            {/* Afteltimer */}
            <Afteltimer eindDatum={data.eindDatum} startDatum={data.startDatum} />

            {/* Stats */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
              <StatKaart
                waarde={data.totaalDeelnemers}
                label="Ingeschreven"
                kleur={BLAUW}
                icon="👥"
              />
              <StatKaart
                waarde={data.levenden}
                label="Nog actief"
                kleur="#2ecc71"
                icon="💚"
              />
              <StatKaart
                waarde={data.totaalDeelnemers - data.levenden}
                label="Geëlimineerd"
                kleur={ROOD}
                icon="💀"
              />
            </div>

            {/* Topschutter */}
            <div style={{
              background: `linear-gradient(135deg, ${BLAUW_DONKER}cc, #1a0a2ecc)`,
              border: `2px solid ${GOUD}`,
              borderRadius: 16,
              padding: '20px 24px',
              marginBottom: 32,
              textAlign: 'center',
              boxShadow: `0 0 25px ${GOUD}33`
            }}>
              <div style={{ color: GOUD, fontSize: 13, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 }}>🏆 Topschutter</div>
              <div style={{ color: GOUD, fontSize: 42, fontWeight: 'bold' }}>
                {data.topschutterAantal}
                {data.aantalTopschutters > 1 && <span style={{ color: '#ffffff88', fontSize: 18, marginLeft: 8 }}>({data.aantalTopschutters} schutters)</span>}
              </div>
              <div style={{ color: '#ffffff66', fontSize: 13, marginTop: 4 }}>eliminaties — identiteit geheim</div>
            </div>

            {/* Tijdlijn */}
            <div style={{
              background: `linear-gradient(135deg, ${BLAUW_DONKER}aa, #0a1628aa)`,
              border: `1px solid #ffffff22`,
              borderRadius: 16,
              padding: '20px 24px',
            }}>
              <div style={{ color: ACCENT, fontSize: 13, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>
                💧 Laatste eliminaties
              </div>
              {data.tijdlijn && data.tijdlijn.length > 0 ? (
                data.tijdlijn.map(item => <TijdlijnItem key={item.id} item={item} />)
              ) : (
                <div style={{ color: '#ffffff33', textAlign: 'center', padding: '20px 0', fontStyle: 'italic' }}>
                  Nog geen eliminaties geregistreerd...
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', marginTop: 40, color: '#ffffff22', fontSize: 12 }}>
              Automatische refresh elke 30s &nbsp;·&nbsp;
              <a href="/regels" style={{ color: ACCENT, textDecoration: "none" }}>📋 Spelregels</a>
              &nbsp;·&nbsp;
              <a href="/mijn-doelwit" style={{ color: ACCENT, textDecoration: "none", fontWeight: "bold" }}>🎯 Mijn doelwit</a>
              &nbsp;;&nbsp;
              <a href="/admin" style={{ color: "#ffffff33", textDecoration: "none" }}>Admin</a>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', color: ROOD, padding: 60 }}>Kon data niet laden.</div>
        )}
      </div>
    </div>
  );
}
