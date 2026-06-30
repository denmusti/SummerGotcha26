'use client';
import { useState, useEffect } from 'react';

const BLAUW = '#1A6B9E';
const BLAUW_DONKER = '#0D3B6E';
const ACCENT = '#00B4D8';
const ROOD = '#C0392B';
const ROOD_LICHT = '#FADBD8';
const GOUD = '#F4D03F';
const GROEN = '#1E8449';
const GROEN_LICHT = '#D5F5E3';
const ORANJE = '#E67E22';
const WIT = '#FFFFFF';

function Input({ label, type = 'text', value, onChange, min, max }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', color: '#ffffff88', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        min={min}
        max={max}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 8,
          border: `1px solid #ffffff33`, background: '#0a1628',
          color: WIT, fontSize: 15, boxSizing: 'border-box',
          outline: 'none',
        }}
      />
    </div>
  );
}

function Knop({ onClick, children, kleur = BLAUW, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: disabled ? '#333' : kleur,
        color: WIT, border: 'none', borderRadius: 8,
        padding: '10px 20px', fontSize: 14, fontWeight: 'bold',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'opacity 0.2s',
      }}
    >
      {children}
    </button>
  );
}

export default function AdminPage() {
  const [ingelogd, setIngelogd] = useState(false);
  const [wachtwoord, setWachtwoord] = useState('');
  const [fout, setFout] = useState('');
  const [data, setData] = useState(null);
  const [bezig, setBezig] = useState(false);
  const [melding, setMelding] = useState('');

  // Form state
  const [totaal, setTotaal] = useState(0);
  const [levenden, setLevenden] = useState(0);
  const [topschutter, setTopschutter] = useState(0);
  const [nieuweEliminatie, setNieuweEliminatie] = useState('');

  async function laadData() {
    const res = await fetch('/api/data');
    const json = await res.json();
    setData(json);
    setTotaal(json.totaalDeelnemers);
    setLevenden(json.levenden);
    setTopschutter(json.topschutterAantal);
  }

  async function login() {
    setBezig(true);
    setFout('');
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wachtwoord, totaalDeelnemers: -1 }) // test call
      });
      if (res.status === 401) {
        setFout('❌ Ongeldig wachtwoord');
      } else {
        setIngelogd(true);
        await laadData();
      }
    } catch (e) {
      setFout('Verbindingsfout');
    } finally {
      setBezig(false);
    }
  }

  async function slaOp() {
    setBezig(true);
    setMelding('');
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wachtwoord,
          totaalDeelnemers: totaal,
          levenden,
          topschutterAantal: topschutter,
        })
      });
      if (res.ok) {
        setMelding('✅ Statistieken opgeslagen!');
        await laadData();
      } else {
        setMelding('❌ Fout bij opslaan');
      }
    } finally {
      setBezig(false);
      setTimeout(() => setMelding(''), 3000);
    }
  }

  async function voegEliminatieIn() {
    if (!nieuweEliminatie.trim()) return;
    setBezig(true);
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wachtwoord, nieuwEliminatie: nieuweEliminatie.trim() })
      });
      if (res.ok) {
        setNieuweEliminatie('');
        setMelding('✅ Eliminatie toegevoegd!');
        await laadData();
      }
    } finally {
      setBezig(false);
      setTimeout(() => setMelding(''), 3000);
    }
  }

  async function verwijderEliminatie(id) {
    setBezig(true);
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wachtwoord, verwijderTijdlijnId: id })
      });
      await laadData();
    } finally {
      setBezig(false);
    }
  }

  if (!ingelogd) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0a1628 0%, #0d2040 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}>
        <div style={{
          background: `linear-gradient(135deg, ${BLAUW_DONKER}cc, #0a1628)`,
          border: `2px solid ${ACCENT}`,
          borderRadius: 20, padding: '40px 36px',
          width: '100%', maxWidth: 380, textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h2 style={{ color: WIT, margin: '0 0 8px', fontSize: 22 }}>Marshall Login</h2>
          <p style={{ color: '#ffffff55', fontSize: 13, margin: '0 0 28px' }}>Summer Gotcha 2026 — Beheerpagina</p>

          <input
            type="password"
            placeholder="Wachtwoord"
            value={wachtwoord}
            onChange={e => setWachtwoord(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            style={{
              width: '100%', padding: '12px 16px', borderRadius: 8,
              border: `1px solid ${fout ? ROOD : '#ffffff33'}`,
              background: '#0a1628', color: WIT, fontSize: 15,
              boxSizing: 'border-box', marginBottom: 12, outline: 'none',
            }}
          />
          {fout && <div style={{ color: ROOD, fontSize: 13, marginBottom: 12 }}>{fout}</div>}
          <Knop onClick={login} disabled={bezig} kleur={BLAUW}>
            {bezig ? 'Bezig...' : '🔓 Inloggen'}
          </Knop>

          <div style={{ marginTop: 24 }}>
            <a href="/" style={{ color: '#ffffff33', fontSize: 12, textDecoration: 'none' }}>← Terug naar publieks pagina</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a1628 0%, #0d2040 100%)',
      color: WIT, padding: '0 0 60px',
    }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${BLAUW_DONKER}, #0a1628)`,
        borderBottom: `3px solid ${ORANJE}`,
        padding: '24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <div style={{ color: ORANJE, fontSize: 12, letterSpacing: 3, textTransform: 'uppercase' }}>Beheerpagina</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 'bold' }}>⚙️ Summer Gotcha 2026</h1>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <a href="/" style={{ color: ACCENT, fontSize: 13, textDecoration: 'none' }}>← Publieks pagina</a>
          <Knop onClick={() => setIngelogd(false)} kleur="#333">Uitloggen</Knop>
        </div>
      </div>

      {melding && (
        <div style={{
          background: melding.includes('✅') ? GROEN_LICHT : ROOD_LICHT,
          color: melding.includes('✅') ? GROEN : ROOD,
          padding: '12px 24px', textAlign: 'center', fontWeight: 'bold',
        }}>
          {melding}
        </div>
      )}

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '32px 16px' }}>

        {/* Statistieken bijwerken */}
        <div style={{
          background: `${BLAUW_DONKER}aa`,
          border: `1px solid #ffffff22`,
          borderRadius: 16, padding: '24px',
          marginBottom: 24,
        }}>
          <h2 style={{ margin: '0 0 20px', color: ACCENT, fontSize: 16, letterSpacing: 2, textTransform: 'uppercase' }}>
            📊 Statistieken bijwerken
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}>
            <Input label="Totaal ingeschreven" type="number" value={totaal} onChange={setTotaal} min={0} />
            <Input label="Nog actief (levenden)" type="number" value={levenden} onChange={setLevenden} min={0} max={totaal} />
            <Input label="Topschutter (# eliminaties)" type="number" value={topschutter} onChange={setTopschutter} min={0} />
          </div>
          <Knop onClick={slaOp} disabled={bezig} kleur={GROEN}>
            {bezig ? 'Bezig...' : '💾 Opslaan'}
          </Knop>
        </div>

        {/* Eliminatie toevoegen */}
        <div style={{
          background: `${BLAUW_DONKER}aa`,
          border: `1px solid #ffffff22`,
          borderRadius: 16, padding: '24px',
          marginBottom: 24,
        }}>
          <h2 style={{ margin: '0 0 20px', color: ACCENT, fontSize: 16, letterSpacing: 2, textTransform: 'uppercase' }}>
            💧 Eliminatie registreren
          </h2>
          <Input
            label="Omschrijving (bv. 'Speler X werd geraakt in de Kerkstraat')"
            value={nieuweEliminatie}
            onChange={setNieuweEliminatie}
          />
          <div style={{ display: 'flex', gap: 12 }}>
            <Knop onClick={voegEliminatieIn} disabled={bezig || !nieuweEliminatie.trim()} kleur={ROOD}>
              💀 Toevoegen aan tijdlijn
            </Knop>
          </div>
          <p style={{ color: '#ffffff44', fontSize: 12, marginTop: 12 }}>
            ℹ️ Namen worden niet vermeld op de publieke pagina tenzij je ze hier ingeeft.
          </p>
        </div>

        {/* Tijdlijn beheren */}
        <div style={{
          background: `${BLAUW_DONKER}aa`,
          border: `1px solid #ffffff22`,
          borderRadius: 16, padding: '24px',
        }}>
          <h2 style={{ margin: '0 0 20px', color: ACCENT, fontSize: 16, letterSpacing: 2, textTransform: 'uppercase' }}>
            📋 Tijdlijn beheren
          </h2>
          {data?.tijdlijn?.length > 0 ? (
            data.tijdlijn.map(item => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 0', borderBottom: '1px solid #ffffff11',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: WIT, fontSize: 14 }}>{item.tekst}</div>
                  <div style={{ color: '#ffffff44', fontSize: 11, marginTop: 3 }}>
                    {new Date(item.tijdstip).toLocaleString('nl-BE')}
                  </div>
                </div>
                <button
                  onClick={() => verwijderEliminatie(item.id)}
                  style={{
                    background: 'none', border: `1px solid ${ROOD}`,
                    color: ROOD, borderRadius: 6, padding: '4px 10px',
                    cursor: 'pointer', fontSize: 12,
                  }}
                >
                  ✕ Verwijder
                </button>
              </div>
            ))
          ) : (
            <div style={{ color: '#ffffff33', fontStyle: 'italic', textAlign: 'center', padding: 20 }}>
              Nog geen eliminaties geregistreerd.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
