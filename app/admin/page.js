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
const ORANJE_LICHT = '#FDEBD0';
const WIT = '#FFFFFF';
const GRIJS = '#F2F2F2';

function Input({ label, value, onChange, type = 'text', min, max, placeholder }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <label style={{ display: 'block', color: '#ffffff88', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>{label}</label>}
      <input type={type} value={value} onChange={e => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
        min={min} max={max} placeholder={placeholder}
        style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #ffffff22', background: '#0a1628', color: WIT, fontSize: 14, boxSizing: 'border-box', outline: 'none' }} />
    </div>
  );
}

function Knop({ onClick, children, kleur = BLAUW, disabled = false, klein = false }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ background: disabled ? '#333' : kleur, color: WIT, border: 'none', borderRadius: 8,
        padding: klein ? '6px 12px' : '10px 18px', fontSize: klein ? 12 : 14, fontWeight: 'bold',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}>
      {children}
    </button>
  );
}

function Sectie({ titel, kleur = ACCENT, children }) {
  return (
    <div style={{ background: `${BLAUW_DONKER}aa`, border: '1px solid #ffffff22', borderRadius: 16, padding: 24, marginBottom: 24 }}>
      <h2 style={{ margin: '0 0 20px', color: kleur, fontSize: 15, letterSpacing: 2, textTransform: 'uppercase' }}>{titel}</h2>
      {children}
    </div>
  );
}

function Tab({ label, actief, onClick }) {
  return (
    <button onClick={onClick}
      style={{ padding: '10px 20px', background: actief ? BLAUW_DONKER : 'transparent',
        color: actief ? ACCENT : '#ffffff55', border: 'none', borderBottom: actief ? `2px solid ${ACCENT}` : '2px solid transparent',
        cursor: 'pointer', fontSize: 14, fontWeight: actief ? 'bold' : 'normal' }}>
      {label}
    </button>
  );
}

export default function AdminPage() {
  const [ingelogd, setIngelogd] = useState(false);
  const [wachtwoord, setWachtwoord] = useState('');
  const [loginFout, setLoginFout] = useState('');
  const [bezig, setBezig] = useState(false);
  const [melding, setMelding] = useState({ tekst: '', type: 'ok' });
  const [actieveTab, setActieveTab] = useState('stats');

  // Stats
  const [data, setData] = useState(null);
  const [totaal, setTotaal] = useState(0);
  const [levenden, setLevenden] = useState(0);
  const [topschutter, setTopschutter] = useState(0);
  const [nieuweEliminatie, setNieuweEliminatie] = useState('');

  // Deelnemers
  const [deelnemers, setDeelnemers] = useState([]);
  const [nieuwVoornaam, setNieuwVoornaam] = useState('');
  const [nieuwFamilienaam, setNieuwFamilienaam] = useState('');
  const [nieuwAdres, setNieuwAdres] = useState('');
  const [nieuwContact, setNieuwContact] = useState('');
  const [nieuwNotitie, setNieuwNotitie] = useState('');
  const [toonCode, setToonCode] = useState(null);

  // Loting
  const [lotingStatus, setLotingStatus] = useState(null);
  const [marshallNaam, setMarshallNaam] = useState('Marshall 1');
  const [aanpSchutter, setAanpSchutter] = useState('');
  const [aanpDoelwit, setAanpDoelwit] = useState('');

  // Eliminatie via deelnemers
  const [elimDeelnemer, setElimDeelnemer] = useState('');
  const [elimTekst, setElimTekst] = useState('');

  function toonMelding(tekst, type = 'ok') {
    setMelding({ tekst, type });
    setTimeout(() => setMelding({ tekst: '', type: 'ok' }), 4000);
  }

  async function laadData() {
    const res = await fetch('/api/data');
    const json = await res.json();
    setData(json);
    setTotaal(json.totaalDeelnemers);
    setLevenden(json.levenden);
    setTopschutter(json.topschutterAantal);
  }

  async function laadDeelnemers() {
    const res = await fetch(`/api/deelnemers?wachtwoord=${wachtwoord}`);
    if (res.ok) {
      const json = await res.json();
      setDeelnemers(json);
    }
  }

  async function login() {
    setBezig(true);
    setLoginFout('');
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wachtwoord, totaalDeelnemers: -1 })
      });
      if (res.status === 401) { setLoginFout('❌ Ongeldig wachtwoord'); }
      else { setIngelogd(true); await laadData(); await laadDeelnemers(); }
    } finally { setBezig(false); }
  }

  async function slaStatsOp() {
    setBezig(true);
    const res = await fetch('/api/data', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wachtwoord, totaalDeelnemers: totaal, levenden, topschutterAantal: topschutter })
    });
    if (res.ok) toonMelding('✅ Statistieken opgeslagen!');
    else toonMelding('❌ Fout bij opslaan', 'fout');
    setBezig(false);
  }

  async function voegEliminatieIn() {
    if (!nieuweEliminatie.trim()) return;
    setBezig(true);
    const res = await fetch('/api/data', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wachtwoord, nieuwEliminatie: nieuweEliminatie.trim() })
    });
    if (res.ok) { setNieuweEliminatie(''); toonMelding('✅ Eliminatie toegevoegd!'); await laadData(); }
    setBezig(false);
  }

  async function verwijderEliminatie(id) {
    setBezig(true);
    await fetch('/api/data', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wachtwoord, verwijderTijdlijnId: id })
    });
    await laadData();
    setBezig(false);
  }

  async function voegDeelnemerToe() {
    if (!nieuwVoornaam.trim() || !nieuwFamilienaam.trim()) {
      toonMelding('❌ Voornaam en familienaam zijn verplicht', 'fout'); return;
    }
    setBezig(true);
    const res = await fetch('/api/deelnemers', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wachtwoord, actie: 'toevoegen', voornaam: nieuwVoornaam.trim(), familienaam: nieuwFamilienaam.trim(), adres: nieuwAdres, contact: nieuwContact, notitie: nieuwNotitie })
    });
    const json = await res.json();
    if (res.ok) {
      setToonCode({ naam: `${nieuwVoornaam} ${nieuwFamilienaam}`, code: json.toegangscode });
      setNieuwVoornaam(''); setNieuwFamilienaam(''); setNieuwAdres(''); setNieuwContact(''); setNieuwNotitie('');
      await laadDeelnemers(); await laadData();
    } else { toonMelding(`❌ ${json.error}`, 'fout'); }
    setBezig(false);
  }

  async function verwijderDeelnemer(id, naam) {
    if (!confirm(`${naam} verwijderen?`)) return;
    setBezig(true);
    const res = await fetch('/api/deelnemers', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wachtwoord, actie: 'verwijderen', id })
    });
    if (res.ok) { toonMelding('✅ Deelnemer verwijderd'); await laadDeelnemers(); await laadData(); }
    setBezig(false);
  }

  async function genereerLoting() {
    if (!confirm(`Loting genereren voor ${deelnemers.filter(d => d.status === 'actief').length} deelnemers? Dit overschrijft de huidige koppeling.`)) return;
    setBezig(true);
    const res = await fetch('/api/loting', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wachtwoord, actie: 'genereer' })
    });
    const json = await res.json();
    if (res.ok) { toonMelding(`✅ Loting gegenereerd voor ${json.aantalDeelnemers} deelnemers!`); await laadDeelnemers(); }
    else { toonMelding(`❌ ${json.error}`, 'fout'); }
    setBezig(false);
  }

  async function valideerKetting() {
    setBezig(true);
    const res = await fetch('/api/loting', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wachtwoord, actie: 'valideer' })
    });
    const json = await res.json();
    setLotingStatus(json);
    setBezig(false);
  }

  async function pasAan() {
    if (!aanpSchutter || !aanpDoelwit || !marshallNaam) {
      toonMelding('❌ Vul alle velden in', 'fout'); return;
    }
    setBezig(true);
    const res = await fetch('/api/loting', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wachtwoord, actie: 'aanpassing', schutter_id: Number(aanpSchutter), nieuw_doelwit_id: Number(aanpDoelwit), marshall_naam: marshallNaam })
    });
    const json = await res.json();
    if (res.ok) { toonMelding(`✅ Aanpassing doorgevoerd. Nog ${json.aanpassingenResterend} aanpassingen over.`); await laadDeelnemers(); setAanpSchutter(''); setAanpDoelwit(''); }
    else { toonMelding(`❌ ${json.error}`, 'fout'); }
    setBezig(false);
  }

  async function elimineerDeelnemer() {
    if (!elimDeelnemer) { toonMelding('❌ Selecteer een deelnemer', 'fout'); return; }
    const d = deelnemers.find(x => x.id === Number(elimDeelnemer));
    if (!confirm(`${d?.voornaam} ${d?.familienaam} elimineren?`)) return;
    setBezig(true);
    const res = await fetch('/api/deelnemers', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wachtwoord, actie: 'elimineren', id: Number(elimDeelnemer), omschrijving: elimTekst || `Een deelnemer werd geëlimineerd` })
    });
    if (res.ok) {
      toonMelding('✅ Deelnemer geëlimineerd!');
      setElimDeelnemer(''); setElimTekst('');
      await laadDeelnemers(); await laadData();
    } else {
      const json = await res.json();
      toonMelding(`❌ ${json.error}`, 'fout');
    }
    setBezig(false);
  }

  const actieveDeelnemers = deelnemers.filter(d => d.status === 'actief');
  const geelimineerdDeelnemers = deelnemers.filter(d => d.status === 'geëlimineerd');

  if (!ingelogd) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0a1628 0%, #0d2040 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: `linear-gradient(135deg, ${BLAUW_DONKER}cc, #0a1628)`, border: `2px solid ${ACCENT}`, borderRadius: 20, padding: '40px 36px', width: '100%', maxWidth: 380, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h2 style={{ color: WIT, margin: '0 0 8px', fontSize: 22 }}>Marshall Login</h2>
          <p style={{ color: '#ffffff55', fontSize: 13, margin: '0 0 28px' }}>Summer Gotcha 2026</p>
          <input type="password" placeholder="Wachtwoord" value={wachtwoord} onChange={e => setWachtwoord(e.target.value)} onKeyDown={e => e.key === 'Enter' && login()}
            style={{ width: '100%', padding: '12px 16px', borderRadius: 8, border: `1px solid ${loginFout ? ROOD : '#ffffff33'}`, background: '#0a1628', color: WIT, fontSize: 15, boxSizing: 'border-box', marginBottom: 12, outline: 'none' }} />
          {loginFout && <div style={{ color: ROOD, fontSize: 13, marginBottom: 12 }}>{loginFout}</div>}
          <Knop onClick={login} disabled={bezig} kleur={BLAUW}>{bezig ? 'Bezig...' : '🔓 Inloggen'}</Knop>
          <div style={{ marginTop: 24 }}><a href="/" style={{ color: '#ffffff33', fontSize: 12, textDecoration: 'none' }}>← Publieke pagina</a></div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0a1628 0%, #0d2040 100%)', color: WIT, paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${BLAUW_DONKER}, #0a1628)`, borderBottom: `3px solid ${ORANJE}`, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ color: ORANJE, fontSize: 11, letterSpacing: 3, textTransform: 'uppercase' }}>Beheerpagina</div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 'bold' }}>⚙️ Summer Gotcha 2026</h1>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <a href="/" style={{ color: ACCENT, fontSize: 13, textDecoration: 'none' }}>← Publieke pagina</a>
          <Knop onClick={() => setIngelogd(false)} kleur="#333" klein>Uitloggen</Knop>
        </div>
      </div>

      {/* Melding */}
      {melding.tekst && (
        <div style={{ background: melding.type === 'ok' ? GROEN_LICHT : ROOD_LICHT, color: melding.type === 'ok' ? GROEN : ROOD, padding: '12px 24px', textAlign: 'center', fontWeight: 'bold' }}>
          {melding.tekst}
        </div>
      )}

      {/* Code popup */}
      {toonCode && (
        <div style={{ position: 'fixed', inset: 0, background: '#000000aa', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ background: BLAUW_DONKER, border: `2px solid ${GOUD}`, borderRadius: 20, padding: 40, textAlign: 'center', maxWidth: 360 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
            <h3 style={{ color: WIT, margin: '0 0 8px' }}>{toonCode.naam}</h3>
            <p style={{ color: '#ffffff66', fontSize: 13, margin: '0 0 20px' }}>Persoonlijke toegangscode:</p>
            <div style={{ background: '#0a1628', border: `2px solid ${GOUD}`, borderRadius: 12, padding: '16px 24px', marginBottom: 20 }}>
              <span style={{ color: GOUD, fontSize: 32, fontWeight: 'bold', letterSpacing: 4 }}>{toonCode.code}</span>
            </div>
            <p style={{ color: '#ffffff44', fontSize: 12, marginBottom: 20 }}>Geef deze code enkel aan de deelnemer zelf. Hiermee kan hij/zij zijn/haar doelwit opvragen.</p>
            <Knop onClick={() => setToonCode(null)} kleur={GROEN}>✓ Begrepen</Knop>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid #ffffff22', display: 'flex', paddingLeft: 24, gap: 4, overflowX: 'auto' }}>
        <Tab label="📊 Stats" actief={actieveTab === 'stats'} onClick={() => setActieveTab('stats')} />
        <Tab label={`👥 Deelnemers (${deelnemers.length})`} actief={actieveTab === 'deelnemers'} onClick={() => setActieveTab('deelnemers')} />
        <Tab label="🎯 Loting" actief={actieveTab === 'loting'} onClick={() => setActieveTab('loting')} />
        <Tab label="💀 Eliminaties" actief={actieveTab === 'eliminaties'} onClick={() => setActieveTab('eliminaties')} />
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '28px 16px' }}>

        {/* TAB: STATS */}
        {actieveTab === 'stats' && (
          <>
            <Sectie titel="📊 Statistieken bijwerken">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
                <Input label="Totaal ingeschreven" type="number" value={totaal} onChange={setTotaal} min={0} />
                <Input label="Nog actief (levenden)" type="number" value={levenden} onChange={setLevenden} min={0} />
                <Input label="Topschutter (# elim.)" type="number" value={topschutter} onChange={setTopschutter} min={0} />
              </div>
              <Knop onClick={slaStatsOp} disabled={bezig} kleur={GROEN}>💾 Opslaan</Knop>
            </Sectie>

            <Sectie titel="💧 Tijdlijn beheren" kleur={ROOD}>
              <Input label="Nieuwe eliminatie toevoegen" value={nieuweEliminatie} onChange={setNieuweEliminatie} placeholder="Omschrijving..." />
              <div style={{ marginBottom: 20 }}>
                <Knop onClick={voegEliminatieIn} disabled={bezig || !nieuweEliminatie.trim()} kleur={ROOD}>💀 Toevoegen</Knop>
              </div>
              {data?.tijdlijn?.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #ffffff11' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: WIT, fontSize: 14 }}>{item.tekst}</div>
                    <div style={{ color: '#ffffff44', fontSize: 11 }}>{new Date(item.tijdstip).toLocaleString('nl-BE')}</div>
                  </div>
                  <button onClick={() => verwijderEliminatie(item.id)}
                    style={{ background: 'none', border: `1px solid ${ROOD}`, color: ROOD, borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>
                    ✕
                  </button>
                </div>
              ))}
            </Sectie>
          </>
        )}

        {/* TAB: DEELNEMERS */}
        {actieveTab === 'deelnemers' && (
          <>
            <Sectie titel="➕ Nieuwe deelnemer toevoegen" kleur={GROEN}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Input label="Voornaam ★" value={nieuwVoornaam} onChange={setNieuwVoornaam} />
                <Input label="Familienaam ★" value={nieuwFamilienaam} onChange={setNieuwFamilienaam} />
              </div>
              <Input label="Adres" value={nieuwAdres} onChange={setNieuwAdres} placeholder="Straat nr, postcode gemeente" />
              <Input label="E-mail / Tel" value={nieuwContact} onChange={setNieuwContact} />
              <Input label="Notities (bv. koppel met nr. X)" value={nieuwNotitie} onChange={setNieuwNotitie} />
              <Knop onClick={voegDeelnemerToe} disabled={bezig} kleur={GROEN}>➕ Toevoegen</Knop>
            </Sectie>

            <Sectie titel={`👥 Actieve deelnemers (${actieveDeelnemers.length})`}>
              {actieveDeelnemers.length === 0 ? (
                <div style={{ color: '#ffffff33', fontStyle: 'italic', textAlign: 'center', padding: 20 }}>Nog geen deelnemers</div>
              ) : actieveDeelnemers.map(d => (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid #ffffff11' }}>
                  <div style={{ background: BLAUW, color: WIT, borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 'bold', minWidth: 36, textAlign: 'center' }}>
                    #{d.nummer}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: WIT, fontWeight: 'bold' }}>{d.voornaam} {d.familienaam}</div>
                    <div style={{ color: '#ffffff55', fontSize: 12 }}>
                      {d.adres && `📍 ${d.adres}`}
                      {d.doelwit && <span style={{ color: ROOD, marginLeft: 8 }}>🎯 {d.doelwit.voornaam} {d.doelwit.familienaam}</span>}
                    </div>
                    <div style={{ color: GOUD, fontSize: 11, marginTop: 2 }}>Code: {d.toegangscode}</div>
                  </div>
                  <Knop onClick={() => verwijderDeelnemer(d.id, `${d.voornaam} ${d.familienaam}`)} kleur={ROOD} klein>✕</Knop>
                </div>
              ))}
            </Sectie>

            {geelimineerdDeelnemers.length > 0 && (
              <Sectie titel={`💀 Geëlimineerd (${geelimineerdDeelnemers.length})`} kleur="#666">
                {geelimineerdDeelnemers.map(d => (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #ffffff11', opacity: 0.6 }}>
                    <div style={{ background: '#333', color: WIT, borderRadius: 8, padding: '4px 10px', fontSize: 12, minWidth: 36, textAlign: 'center' }}>#{d.nummer}</div>
                    <div style={{ flex: 1, color: '#ffffff88', textDecoration: 'line-through' }}>{d.voornaam} {d.familienaam}</div>
                  </div>
                ))}
              </Sectie>
            )}
          </>
        )}

        {/* TAB: LOTING */}
        {actieveTab === 'loting' && (
          <>
            <Sectie titel="🎲 Loting genereren" kleur={GOUD}>
              <p style={{ color: '#ffffff66', fontSize: 13, marginTop: 0 }}>
                Genereert een gesloten ketting voor alle {actieveDeelnemers.length} actieve deelnemers. Overschrijft de huidige koppeling.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Knop onClick={genereerLoting} disabled={bezig || actieveDeelnemers.length < 3} kleur={GOUD}>
                  🎲 Genereer loting
                </Knop>
                <Knop onClick={valideerKetting} disabled={bezig} kleur={BLAUW}>
                  🔗 Valideer ketting
                </Knop>
              </div>
              {lotingStatus && (
                <div style={{ marginTop: 16, background: lotingStatus.geldig ? GROEN_LICHT : ROOD_LICHT, borderRadius: 10, padding: 16 }}>
                  <div style={{ color: lotingStatus.geldig ? GROEN : ROOD, fontWeight: 'bold', marginBottom: 8 }}>
                    {lotingStatus.geldig ? '✅ Ketting is geldig!' : `❌ ${lotingStatus.fouten.length} probleem(en) gevonden`}
                  </div>
                  {!lotingStatus.geldig && lotingStatus.fouten.map((f, i) => (
                    <div key={i} style={{ color: ROOD, fontSize: 13 }}>• {f}</div>
                  ))}
                </div>
              )}
            </Sectie>

            <Sectie titel="🔧 Marshall aanpassing" kleur={ORANJE}>
              <p style={{ color: '#ffffff66', fontSize: 13, marginTop: 0 }}>Max. 3 aanpassingen per marshall.</p>
              <Input label="Marshall naam" value={marshallNaam} onChange={setMarshallNaam} placeholder="bv. Marshall 1" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', color: '#ffffff88', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Schutter</label>
                  <select value={aanpSchutter} onChange={e => setAanpSchutter(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #ffffff22', background: '#0a1628', color: WIT, fontSize: 14 }}>
                    <option value="">Kies schutter...</option>
                    {actieveDeelnemers.map(d => <option key={d.id} value={d.id}>#{d.nummer} {d.voornaam} {d.familienaam}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', color: '#ffffff88', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Nieuw doelwit</label>
                  <select value={aanpDoelwit} onChange={e => setAanpDoelwit(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #ffffff22', background: '#0a1628', color: WIT, fontSize: 14 }}>
                    <option value="">Kies doelwit...</option>
                    {actieveDeelnemers.filter(d => d.id !== Number(aanpSchutter)).map(d => <option key={d.id} value={d.id}>#{d.nummer} {d.voornaam} {d.familienaam}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginTop: 12 }}>
                <Knop onClick={pasAan} disabled={bezig || !aanpSchutter || !aanpDoelwit} kleur={ORANJE}>🔧 Aanpassing doorvoeren</Knop>
              </div>
            </Sectie>

            <Sectie titel="📋 Huidige koppelingen">
              {actieveDeelnemers.filter(d => d.doelwit).length === 0 ? (
                <div style={{ color: '#ffffff33', fontStyle: 'italic', textAlign: 'center', padding: 20 }}>Nog geen loting gegenereerd</div>
              ) : actieveDeelnemers.map(d => (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #ffffff11' }}>
                  <div style={{ color: WIT, minWidth: 180 }}>#{d.nummer} {d.voornaam} {d.familienaam}</div>
                  <div style={{ color: ACCENT, fontSize: 18 }}>→</div>
                  <div style={{ color: ROOD }}>
                    {d.doelwit ? `#${d.doelwit_nummer || ''} ${d.doelwit.voornaam} ${d.doelwit.familienaam}` : <span style={{ color: '#ffffff33', fontStyle: 'italic' }}>geen doelwit</span>}
                  </div>
                </div>
              ))}
            </Sectie>
          </>
        )}

        {/* TAB: ELIMINATIES */}
        {actieveTab === 'eliminaties' && (
          <Sectie titel="💀 Deelnemer elimineren" kleur={ROOD}>
            <p style={{ color: '#ffffff66', fontSize: 13, marginTop: 0 }}>
              Bij eliminatie wordt de doelwitkoppeling automatisch overgedragen aan de schutter.
            </p>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', color: '#ffffff88', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Geëlimineerde deelnemer</label>
              <select value={elimDeelnemer} onChange={e => setElimDeelnemer(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #ffffff22', background: '#0a1628', color: WIT, fontSize: 14 }}>
                <option value="">Kies deelnemer...</option>
                {actieveDeelnemers.map(d => <option key={d.id} value={d.id}>#{d.nummer} {d.voornaam} {d.familienaam}</option>)}
              </select>
            </div>
            <Input label="Omschrijving voor tijdlijn (optioneel)" value={elimTekst} onChange={setElimTekst} placeholder="bv. Deelnemer werd geraakt aan Café NOBIS" />
            <Knop onClick={elimineerDeelnemer} disabled={bezig || !elimDeelnemer} kleur={ROOD}>💀 Elimineer deelnemer</Knop>
          </Sectie>
        )}
      </div>
    </div>
  );
}
