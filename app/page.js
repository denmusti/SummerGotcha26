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

function Erelijst({ titel, icon, kleur, items, uitgelicht }) {
  return (
    <div style={{
      background: `linear-gradient(135deg, ${BLAUW_DONKER}aa, #0a1628aa)`,
      border: `1px solid #ffffff22`,
      borderRadius: 16,
      padding: '20px 24px',
      marginBottom: 20,
    }}>
      <div style={{ color: kleur, fontSize: 13, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 14 }}>
        {icon} {titel}
      </div>
      {items.length === 0 ? (
        <div style={{ color: '#ffffff33', fontStyle: 'italic', padding: '8px 0' }}>Niemand.</div>
      ) : items.map((p, i) => {
        const isTop = uitgelicht && i === 0;
        return (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 0', borderBottom: i < items.length - 1 ? '1px solid #ffffff11' : 'none',
          }}>
            <div style={{
              width: 26, textAlign: 'center', fontWeight: 'bold',
              color: isTop ? GOUD : '#ffffff55', fontSize: isTop ? 18 : 14,
            }}>{i === 0 && uitgelicht ? '🥇' : i + 1}</div>
            <div style={{
              width: 40, height: 48, borderRadius: 6, overflow: 'hidden', flexShrink: 0,
              background: `linear-gradient(135deg, ${kleur}33, ${BLAUW_DONKER})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
            }}>
              {p.foto_url ? <img src={p.foto_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '🔫'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: isTop ? GOUD : WIT, fontSize: 15, fontWeight: isTop ? 'bold' : 'normal' }}>{p.naam}</div>
              <div style={{ color: '#ffffff44', fontSize: 12, marginTop: 2 }}>
                {p.status === 'actief' ? '💚 overleefde' : '💀 geëlimineerd'}
              </div>
            </div>
            <div style={{ color: isTop ? GOUD : ACCENT, fontSize: 18, fontWeight: 'bold' }}>
              {p.kills} <span style={{ fontSize: 12, color: '#ffffff55', fontWeight: 'normal' }}>kill{p.kills === 1 ? '' : 's'}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function WinnaarsOverzicht({ winnaars }) {
  const { winnaar, overlevenden, topkiller, topkillers } = winnaars;
  return (
    <div style={{ marginBottom: 32 }}>
      {winnaar && (
        <div style={{
          background: `linear-gradient(135deg, ${BLAUW_DONKER}, #1a0a2e)`,
          border: `2px solid ${GOUD}`,
          borderRadius: 16,
          padding: '28px 24px',
          textAlign: 'center',
          marginBottom: 20,
          boxShadow: `0 0 35px ${GOUD}44`,
        }}>
          <div style={{ color: GOUD, fontSize: 13, letterSpacing: 4, textTransform: 'uppercase', marginBottom: 12 }}>
            🏆 De winnaar van Summer Gotcha 2026
          </div>
          {winnaar.foto_url && (
            <img src={winnaar.foto_url} alt="" style={{
              width: 110, height: 130, objectFit: 'cover', borderRadius: 12,
              border: `2px solid ${GOUD}`, marginBottom: 14,
            }} />
          )}
          <div style={{ color: GOUD, fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 'bold' }}>{winnaar.naam}</div>
          <div style={{ color: '#ffffff88', fontSize: 14, marginTop: 6 }}>
            overleefde met {winnaar.kills} eliminatie{winnaar.kills === 1 ? '' : 's'}
          </div>
        </div>
      )}

      <Erelijst titel="Overlevenden" icon="💚" kleur="#2ecc71" items={overlevenden} uitgelicht />

      {topkiller && (
        <div style={{
          background: `linear-gradient(135deg, ${BLAUW_DONKER}cc, ${ROOD}22)`,
          border: `2px solid ${ROOD}`,
          borderRadius: 16,
          padding: '18px 24px',
          textAlign: 'center',
          marginBottom: 20,
        }}>
          <div style={{ color: ROOD, fontSize: 13, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 4 }}>💀 Topkiller</div>
          <div style={{ color: WIT, fontSize: 26, fontWeight: 'bold' }}>{topkiller.naam}</div>
          <div style={{ color: '#ffffff66', fontSize: 13, marginTop: 4 }}>
            {topkiller.kills} eliminaties · {topkiller.status === 'actief' ? '💚 nog in leven' : '💀 geëlimineerd'}
          </div>
        </div>
      )}

      <Erelijst titel="Alle scherpschutters" icon="🎯" kleur={ROOD} items={topkillers} uitgelicht />
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

            {/* Winnaarsoverzicht — enkel als het spel gedaan is */}
            {data.spelGedaan && data.winnaars && <WinnaarsOverzicht winnaars={data.winnaars} />}

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

            {/* Topschutter (anoniem tijdens het spel; na afloop toont het winnaarsoverzicht de namen) */}
            {!data.spelGedaan && (
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
            )}

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
