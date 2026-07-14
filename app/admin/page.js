'use client';
import { useState, useEffect, useRef } from 'react';

const BD = '#0D3B6E', BM = '#1A6B9E', AC = '#00B4D8';
const RD = '#C0392B', RL = '#FADBD8';
const GD = '#F4D03F', GR = '#1E8449', GL = '#D5F5E3';
const OR = '#E67E22', OL = '#FDEBD0';
const WIT = '#FFFFFF', GR2 = '#F2F2F2';

const inp = { width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid #ffffff22', background:'#0a1628', color:WIT, fontSize:14, boxSizing:'border-box', outline:'none' };
const sel = { ...inp, cursor:'pointer' };

function Label({ t }) { return <label style={{ display:'block', color:'#ffffff88', fontSize:11, letterSpacing:1, textTransform:'uppercase', marginBottom:4 }}>{t}</label>; }
function Inp({ label, value, onChange, type='text', min, max, placeholder }) {
  return <div style={{ marginBottom:12 }}>{label && <Label t={label} />}<input type={type} value={value} onChange={e => onChange(type==='number'?Number(e.target.value):e.target.value)} min={min} max={max} placeholder={placeholder} style={inp} /></div>;
}
function Sel({ label, value, onChange, children }) {
  return <div style={{ marginBottom:12 }}>{label && <Label t={label} />}<select value={value} onChange={e => onChange(e.target.value)} style={sel}>{children}</select></div>;
}
function Btn({ onClick, children, kleur=BM, disabled=false, klein=false }) {
  return <button onClick={onClick} disabled={disabled} style={{ background:disabled?'#333':kleur, color:WIT, border:'none', borderRadius:8, padding:klein?'6px 12px':'10px 18px', fontSize:klein?12:14, fontWeight:'bold', cursor:disabled?'not-allowed':'pointer', opacity:disabled?0.5:1 }}>{children}</button>;
}
function Vak({ titel, kleur=AC, children }) {
  return <div style={{ background:`${BD}aa`, border:'1px solid #ffffff22', borderRadius:16, padding:24, marginBottom:24 }}><h2 style={{ margin:'0 0 18px', color:kleur, fontSize:15, letterSpacing:2, textTransform:'uppercase' }}>{titel}</h2>{children}</div>;
}
function Tab({ label, actief, onClick }) {
  return <button onClick={onClick} style={{ padding:'10px 16px', background:actief?BD:'transparent', color:actief?AC:'#ffffff55', border:'none', borderBottom:actief?`2px solid ${AC}`:'2px solid transparent', cursor:'pointer', fontSize:13, fontWeight:actief?'bold':'normal', whiteSpace:'nowrap' }}>{label}</button>;
}

export default function AdminPage() {
  const [ingelogd, setIngelogd] = useState(false);
  const [ww, setWw] = useState(''); // marshall wachtwoord
  const [isAdmin, setIsAdmin] = useState(false);
  const [marshallInfo, setMarshallInfo] = useState(null);
  const [loginFout, setLoginFout] = useState('');
  const [bezig, setBezig] = useState(false);
  const [melding, setMelding] = useState({ t:'', type:'ok' });
  const [tab, setTab] = useState('stats');

  // Stats
  const [data, setData] = useState(null);
  const [totaal, setTotaal] = useState(0);
  const [levenden, setLevenden] = useState(0);
  const [topschutter, setTopschutter] = useState(0);
  const [nieuweElim, setNieuweElim] = useState('');

  // Deelnemers
  const [deelnemers, setDeelnemers] = useState([]);
  const [nVn, setNVn] = useState('');
  const [nFn, setNFn] = useState('');
  const [nAdres, setNAdres] = useState('');
  const [nContact, setNContact] = useState('');
  const [nNotitie, setNNotitie] = useState('');
  const [nFoto, setNFoto] = useState(null);
  const [nFotoNaam, setNFotoNaam] = useState('');
  const nFotoRef = useRef(null);
  const [toonPopup, setToonPopup] = useState(null);
  const [fotoBezig, setFotoBezig] = useState({});
  const fotoRef = useRef({});

  // Loting
  const [lotingStatus, setLotingStatus] = useState(null);
  const [marshallNaam, setMarshallNaam] = useState('Marshall 1');
  const [aanpS, setAanpS] = useState('');
  const [aanpD, setAanpD] = useState('');
  const [sw1, setSw1] = useState('');
  const [sw2, setSw2] = useState('');
  const [testLotingPreview, setTestLotingPreview] = useState(null);

  // Eliminaties
  const [elimD, setElimD] = useState('');
  const [elimTekst, setElimTekst] = useState('');
  const [killcodeInput, setKillcodeInput] = useState('');
  const [killcodeResult, setKillcodeResult] = useState(null);

  // Marshalls beheer
  const [marshallLijst, setMarshallLijst] = useState([]);
  const [nieuwMarshallNaam, setNieuwMarshallNaam] = useState('');
  const [nieuwMarshallIsAdmin, setNieuwMarshallIsAdmin] = useState(false);
  const [nieuwMarshallWw, setNieuwMarshallWw] = useState('');
  const [nieuwMarshallTel, setNieuwMarshallTel] = useState('');

  // WhatsApp
  const [waMarshalls, setWaMarshalls] = useState(['']);
  const [waBericht, setWaBericht] = useState('');
  const [waBezig, setWaBezig] = useState(false);

  // Herversturing kill bericht
  const [herversturBezig, setHerversturBezig] = useState(false);
  const [killsLijst, setKillsLijst] = useState([]);

  // Admin preview
  const [previewDeelnemer, setPreviewDeelnemer] = useState(null);
  const [previewForceGestart, setPreviewForceGestart] = useState(false);

  function toonMelding(t, type='ok') {
    setMelding({ t, type });
    setTimeout(() => setMelding({ t:'', type:'ok' }), 4000);
  }

  async function api(url, body) {
    const res = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ wachtwoord:ww, ...body }) });
    return { res, json: await res.json() };
  }

  async function laadMarshalls() {
    const res = await fetch(`/api/marshalls?lijst=true&adminWw=${encodeURIComponent(ww)}`);
    if (res.ok) setMarshallLijst(await res.json());
  }

  async function laadData() {
    const res = await fetch('/api/data');
    const json = await res.json();
    setData(json); setTotaal(json.totaalDeelnemers); setLevenden(json.levenden); setTopschutter(json.topschutterAantal);
  }

  async function laadDeelnemers(overrideWw) {
    const geldigWw = overrideWw || ww;
    const res = await fetch(`/api/deelnemers?wachtwoord=${encodeURIComponent(geldigWw)}`);
    if (res.ok) setDeelnemers(await res.json());
  }

  async function login() {
    setBezig(true); setLoginFout('');
    const res = await fetch(`/api/check-wachtwoord?wachtwoord=${encodeURIComponent(ww)}`);
    const json = await res.json();
    if (res.status === 401) { setLoginFout('❌ Ongeldig wachtwoord'); setBezig(false); return; }
    const m = json.marshall;
    setMarshallInfo(m);
    setIsAdmin(m.is_admin);
    setMarshallNaam(m.naam);
    setIngelogd(true);
    await laadData();
    await laadDeelnemers(ww);
    if (m.is_admin) await laadMarshalls();
    setBezig(false);
  }

  async function herstelTellers() {
    // Herbereken tellers op basis van werkelijke data in de database
    setBezig(true);
    const { res } = await api('/api/deelnemers', { actie:'herstelTellers' });
    if (res.ok) { toonMelding('✅ Tellers hersteld!'); await laadData(); await laadDeelnemers(); }
    setBezig(false);
  }

  async function slaStatsOp() {
    setBezig(true);
    const { res } = await api('/api/data', { totaalDeelnemers:totaal, levenden, topschutterAantal:topschutter });
    if (res.ok) toonMelding('✅ Statistieken opgeslagen!');
    else toonMelding('❌ Fout bij opslaan', 'fout');
    setBezig(false);
  }

  async function voegElimToe() {
    if (!nieuweElim.trim()) return;
    setBezig(true);
    const { res } = await api('/api/data', { nieuwEliminatie:nieuweElim.trim() });
    if (res.ok) { setNieuweElim(''); toonMelding('✅ Toegevoegd!'); await laadData(); }
    setBezig(false);
  }

  async function verwijderElim(id) {
    setBezig(true);
    await api('/api/data', { verwijderTijdlijnId:id });
    await laadData(); setBezig(false);
  }

  async function voegDeelnemerToe() {
    if (!nVn.trim() || !nFn.trim()) { toonMelding('❌ Voornaam en familienaam zijn verplicht', 'fout'); return; }
    setBezig(true);
    const { res, json } = await api('/api/deelnemers', { actie:'toevoegen', voornaam:nVn.trim(), familienaam:nFn.trim(), adres:nAdres, contact:nContact, notitie:nNotitie });
    if (res.ok) {
      // Upload foto als die geselecteerd is
      if (nFoto) {
        const fd = new FormData();
        fd.append('wachtwoord', ww);
        fd.append('deelnemerId', json.deelnemer.id);
        fd.append('foto', nFoto);
        await fetch('/api/foto', { method:'POST', body:fd });
      }
      setToonPopup({ naam:`${nVn} ${nFn}`, toegangscode:json.toegangscode, killcode:json.killcode });
      setNVn(''); setNFn(''); setNAdres(''); setNContact(''); setNNotitie(''); setNFoto(null); setNFotoNaam('');
      await laadDeelnemers(); await laadData();
    } else toonMelding(`❌ ${json.error}`, 'fout');
    setBezig(false);
  }

  async function uploadFoto(deelnemerId, file) {
    setFotoBezig(p => ({ ...p, [deelnemerId]:true }));
    const fd = new FormData();
    fd.append('wachtwoord', ww);
    fd.append('deelnemerId', deelnemerId);
    fd.append('foto', file);
    const res = await fetch('/api/foto', { method:'POST', body:fd });
    const json = await res.json();
    if (res.ok) { toonMelding('✅ Foto geüpload!'); await laadDeelnemers(); }
    else toonMelding(`❌ ${json.error}`, 'fout');
    setFotoBezig(p => ({ ...p, [deelnemerId]:false }));
  }

  async function verwijderDeelnemer(id, naam) {
    if (!confirm(`${naam} verwijderen?`)) return;
    setBezig(true);
    const { res } = await api('/api/deelnemers', { actie:'verwijderen', id });
    if (res.ok) { toonMelding('✅ Verwijderd'); await laadDeelnemers(); await laadData(); }
    setBezig(false);
  }

  async function genereerLoting(isTest=false) {
    const actief = deelnemers.filter(d => d.status==='actief').length;
    if (!confirm(`${isTest?'TEST-loting':'Loting'} genereren voor ${actief} deelnemers?${isTest?' (testmodus — overschrijft huidige koppeling niet)':' (overschrijft huidige koppeling!)'}`)) return;
    setBezig(true);
    const { res, json } = await api('/api/loting', { actie:'genereer', testModus:isTest });
    if (res.ok) {
      if (isTest) {
        setTestLotingPreview(json.preview);
        toonMelding(`✅ Test-loting gegenereerd voor ${json.aantalDeelnemers} deelnemers — zie preview hieronder.`);
      } else {
        setTestLotingPreview(null);
        toonMelding(`✅ Loting gegenereerd voor ${json.aantalDeelnemers} deelnemers!`);
        await laadDeelnemers();
        // Reset tellers direct in de state — database is al gereset
        setMarshallInfo(prev => prev ? { ...prev, aanpassingen: 0 } : prev);
        setMarshallLijst(prev => prev.map(m => ({ ...m, aanpassingen: 0 })));
      }
    }
    else toonMelding(`❌ ${json.error}`, 'fout');
    setBezig(false);
  }

  async function valideerKetting() {
    setBezig(true);
    const { json } = await api('/api/loting', { actie:'valideer' });
    setLotingStatus(json); setBezig(false);
  }

  async function switchViaMarshall() {
    if (!sw1 || !sw2 || sw1 === sw2) { toonMelding('❌ Kies 2 verschillende deelnemers', 'fout'); return; }
    setBezig(true);
    // Marshall ID ophalen: als ingelogd als marshall gebruik marshallInfo, anders zoek in lijst
    const mid = marshallInfo?.id;
    if (!mid) { toonMelding('❌ Marshall niet gevonden in de lijst', 'fout'); setBezig(false); return; }
    const { res, json } = await api('/api/loting', { actie:'aanpassing', schutter_id:Number(sw1), nieuw_doelwit_id:Number(sw2), marshall_id: mid });
    if (res.ok) {
      toonMelding(`✅ Doelwitten gewisseld. Nog ${json.aanpassingenResterend} aanpassing(en) over.`);
      await laadDeelnemers(); await laadData(); await laadMarshalls();
      setMarshallInfo(prev => prev ? ({ ...prev, aanpassingen: (prev.aanpassingen||0) + 1 }) : prev);
      setSw1(''); setSw2('');
    } else toonMelding(`❌ ${json.error}`, 'fout');
    setBezig(false);
  }

  async function pasAan() {
    if (!aanpS || !aanpD || !marshallNaam) { toonMelding('❌ Vul alle velden in', 'fout'); return; }
    setBezig(true);
    const { res, json } = await api('/api/loting', { actie:'aanpassing', schutter_id:Number(aanpS), nieuw_doelwit_id:Number(aanpD), marshall_naam:marshallNaam });
    if (res.ok) { toonMelding(`✅ Aanpassing doorgevoerd. Nog ${json.aanpassingenResterend} over.`); await laadDeelnemers(); setAanpS(''); setAanpD(''); }
    else toonMelding(`❌ ${json.error}`, 'fout');
    setBezig(false);
  }


  async function switchViaMarshall() {
    if (!sw1 || !sw2 || sw1 === sw2) { toonMelding('❌ Kies 2 verschillende deelnemers', 'fout'); return; }
    setBezig(true);
    // Marshall ID ophalen: als ingelogd als marshall gebruik marshallInfo, anders zoek in lijst
    const mid = marshallInfo?.id;
    if (!mid) { toonMelding('❌ Marshall niet gevonden in de lijst', 'fout'); setBezig(false); return; }
    const { res, json } = await api('/api/loting', { actie:'aanpassing', schutter_id:Number(sw1), nieuw_doelwit_id:Number(sw2), marshall_id: mid });
    if (res.ok) {
      toonMelding(`✅ Doelwitten gewisseld. Nog ${json.aanpassingenResterend} aanpassing(en) over.`);
      await laadDeelnemers(); await laadData(); await laadMarshalls();
      setMarshallInfo(prev => prev ? ({ ...prev, aanpassingen: (prev.aanpassingen||0) + 1 }) : prev);
      setSw1(''); setSw2('');
    } else toonMelding(`❌ ${json.error}`, 'fout');
    setBezig(false);
  }

  async function pasAan() {
    if (!aanpS || !aanpD || !marshallNaam) { toonMelding('❌ Vul alle velden in', 'fout'); return; }
    setBezig(true);
    const { res, json } = await api('/api/loting', { actie:'aanpassing', schutter_id:Number(aanpS), nieuw_doelwit_id:Number(aanpD), marshall_naam:marshallNaam });
    if (res.ok) { toonMelding(`✅ Aanpassing doorgevoerd. Nog ${json.aanpassingenResterend} over.`); await laadDeelnemers(); setAanpS(''); setAanpD(''); }
    else toonMelding(`❌ ${json.error}`, 'fout');
    setBezig(false);
  }

  async function switchDeelnemers() {
    if (!sw1 || !sw2 || sw1===sw2) { toonMelding('❌ Kies 2 verschillende deelnemers', 'fout'); return; }
    setBezig(true);
    const { res, json } = await api('/api/deelnemers', { actie:'switch', id1:Number(sw1), id2:Number(sw2) });
    if (res.ok) { toonMelding('✅ Doelwitten gewisseld!'); await laadDeelnemers(); setSw1(''); setSw2(''); }
    else toonMelding(`❌ ${json.error}`, 'fout');
    setBezig(false);
  }

  async function controleerKillcode() {
    if (!killcodeInput.trim()) return;
    setBezig(true);
    const { res, json } = await api('/api/deelnemers', { actie:'killcode', killcode:killcodeInput });
    if (res.ok) setKillcodeResult(json);
    else { setKillcodeResult({ fout: json.error }); }
    setBezig(false);
  }

  async function bevestigElim(id, metKillcode=false) {
    setBezig(true);
    const { res } = await api('/api/deelnemers', { actie:'elimineren', id, omschrijving:elimTekst, killcode_gebruikt:metKillcode });
    if (res.ok) {
      toonMelding('✅ Geëlimineerd!');
      setElimD(''); setElimTekst(''); setKillcodeResult(null); setKillcodeInput('');
      await laadDeelnemers(); await laadData();
    }
    setBezig(false);
  }

  async function toggleAdmin(id, huidig) {
    setBezig(true);
    const res = await fetch('/api/marshalls', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminWachtwoord: ww, actie: 'toggleAdmin', id, is_admin: !huidig })
    });
    if (res.ok) { toonMelding(`✅ Admin rechten ${!huidig ? 'toegekend' : 'ingetrokken'}`); await laadMarshalls(); }
    setBezig(false);
  }

  async function voegMarshallToe() {
    if (!nieuwMarshallNaam.trim() || !nieuwMarshallWw.trim()) {
      toonMelding('❌ Naam en wachtwoord zijn verplicht', 'fout'); return;
    }
    setBezig(true);
    const res = await fetch('/api/marshalls', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminWachtwoord: ww, actie: 'toevoegen', naam: nieuwMarshallNaam, wachtwoord: nieuwMarshallWw, telefoon: nieuwMarshallTel, is_admin: nieuwMarshallIsAdmin })
    });
    if (res.ok) {
      toonMelding('✅ Marshall toegevoegd!');
      setNieuwMarshallNaam(''); setNieuwMarshallWw(''); setNieuwMarshallTel(''); setNieuwMarshallIsAdmin(false);
      await laadMarshalls();
    } else toonMelding('❌ Fout bij toevoegen', 'fout');
    setBezig(false);
  }

  async function verwijderMarshall(id) {
    if (!confirm('Marshall verwijderen?')) return;
    setBezig(true);
    const res = await fetch('/api/marshalls', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminWachtwoord: ww, actie: 'verwijderen', id })
    });
    if (res.ok) { toonMelding('✅ Marshall verwijderd'); await laadMarshalls(); }
    setBezig(false);
  }

  async function resetMarshallAanpassingen(id, naam) {
    setBezig(true);
    const res = await fetch('/api/marshalls', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminWachtwoord: ww, actie: 'resetAanpassingen', id })
    });
    if (res.ok) { toonMelding(`✅ Teller van ${naam} gereset`); await laadMarshalls(); }
    setBezig(false);
  }

  async function herversturKillBericht() {
    if (!confirm('Kill bericht opnieuw versturen naar alle actieve deelnemers en marshalls?')) return;
    setHerversturBezig(true);
    const { res, json } = await api('/api/notificaties', {
      schutter: 'Onbekend',
      slachtoffer: 'Otto Bourgonjon',
      nieuwDoelwit: 'Onbekend',
      tijdstip: new Date().toISOString(),
    });
    if (res.ok) toonMelding(`✅ Kill bericht verstuurd! Deelnemers: ${json.deelnemers?.verzonden || 0}, Marshalls: ${json.marshalls?.verzonden || 0}`);
    else toonMelding(`❌ ${json.error || 'Fout'}`, 'fout');
    setHerversturBezig(false);
  }

  async function stuurStartBerichtenAlle() {
    if (!confirm('Startbericht sturen naar alle actieve deelnemers? Doe dit slechts één keer!')) return;
    setWaBezig(true);
    const { res, json } = await api('/api/notificaties', { actie: 'start' });
    if (res.ok) toonMelding(`✅ Startberichten verzonden! ${json.deelnemers?.verzonden || 0} ontvangen, ${json.deelnemers?.mislukt || 0} mislukt.`);
    else toonMelding(`❌ ${json.error || 'Fout'}`, 'fout');
    setWaBezig(false);
  }

  async function slaWaOp() {
    setWaBezig(true);
    const geldigeNummers = waMarshalls.filter(n => n.trim());
    const { res } = await api('/api/data', { marshallTelefoons: geldigeNummers });
    if (res.ok) toonMelding('✅ Marshall nummers opgeslagen!');
    else toonMelding('❌ Fout bij opslaan', 'fout');
    setWaBezig(false);
  }

  async function testWaType(testType) {
    setWaBezig(true);
    const { res, json } = await api('/api/notificaties', { testBericht: true, testType });
    if (res.ok) toonMelding(`✅ Testbericht verzonden naar ${json.marshalls?.verzonden || 0} marshall(s)!`);
    else toonMelding(`❌ ${json.error || json.reden || 'Fout'}`, 'fout');
    setWaBezig(false);
  }

  async function laadAdminPreview() {
    setBezig(true);
    const res = await fetch('/api/mijn-doelwit', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ toegangscode:ww, adminPreview:true })
    });
    const json = await res.json();
    if (res.ok) setPreviewDeelnemer(json);
    setBezig(false);
  }

  const actief = deelnemers.filter(d => d.status==='actief');
  const geelim = deelnemers.filter(d => d.status==='geëlimineerd');

  if (!ingelogd) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(180deg,#0a1628,#0d2040)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ background:`linear-gradient(135deg,${BD}cc,#0a1628)`, border:`2px solid ${AC}`, borderRadius:20, padding:'40px 36px', width:'100%', maxWidth:380, textAlign:'center' }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🔒</div>
        <h2 style={{ color:WIT, margin:'0 0 8px', fontSize:22 }}>Summer Gotcha 2026</h2>
        <p style={{ color:'#ffffff55', fontSize:13, margin:'0 0 24px' }}>Beheerpagina — marshalls</p>
        <input type="password" placeholder="Jouw wachtwoord" value={ww} onChange={e=>setWw(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()}
          style={{ ...inp, marginBottom:12, border:`1px solid ${loginFout?RD:'#ffffff33'}`, fontSize:15, padding:'12px 16px' }} />
        {loginFout && <div style={{ color:RD, fontSize:13, marginBottom:12 }}>{loginFout}</div>}
        <Btn onClick={login} disabled={bezig} kleur={BM}>{bezig?'Bezig...':'🔓 Inloggen'}</Btn>
        <div style={{ marginTop:24 }}><a href="/" style={{ color:'#ffffff33', fontSize:12, textDecoration:'none' }}>← Publieke pagina</a></div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(180deg,#0a1628,#0d2040)', color:WIT, paddingBottom:60 }}>
      {/* Header */}
      <div style={{ background:`linear-gradient(135deg,${BD},#0a1628)`, borderBottom:`3px solid ${OR}`, padding:'20px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ color:OR, fontSize:11, letterSpacing:3, textTransform:'uppercase' }}>Beheerpagina</div>
          <h1 style={{ margin:0, fontSize:20, fontWeight:'bold' }}>⚙️ Summer Gotcha 2026</h1>
          <div style={{ color:isAdmin?GD:OR, fontSize:12 }}>Ingelogd als: <strong>{marshallInfo?.naam}</strong>{isAdmin?' ⭐ Admin':` — ${3-(marshallInfo?.aanpassingen||0)} aanpassing(en) resterend`}</div>
        </div>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <a href="/" style={{ color:AC, fontSize:13, textDecoration:'none' }}>← Publieke pagina</a>
          <Btn onClick={()=>{setIngelogd(false);setIsAdmin(false);setMarshallInfo(null);setWw('');}} kleur="#333" klein>Uitloggen</Btn>
        </div>
      </div>

      {/* Melding */}
      {melding.t && <div style={{ background:melding.type==='ok'?GL:RL, color:melding.type==='ok'?GR:RD, padding:'12px 24px', textAlign:'center', fontWeight:'bold' }}>{melding.t}</div>}

      {/* Popup: toegangscode + killcode */}
      {toonPopup && (
        <div style={{ position:'fixed', inset:0, background:'#000000aa', display:'flex', alignItems:'center', justifyContent:'center', zIndex:100 }}>
          <div style={{ background:BD, border:`2px solid ${GD}`, borderRadius:20, padding:36, textAlign:'center', maxWidth:380, width:'90%' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🎯</div>
            <h3 style={{ color:WIT, margin:'0 0 20px' }}>{toonPopup.naam}</h3>
            <div style={{ background:'#0a1628', border:`1px solid ${AC}`, borderRadius:12, padding:16, marginBottom:12 }}>
              <div style={{ color:'#ffffff66', fontSize:11, letterSpacing:2, textTransform:'uppercase', marginBottom:4 }}>Toegangscode (doelwit opvragen)</div>
              <div style={{ color:AC, fontSize:26, fontWeight:'bold', letterSpacing:4 }}>{toonPopup.toegangscode}</div>
            </div>
            <div style={{ background:'#0a1628', border:`1px solid ${RD}`, borderRadius:12, padding:16, marginBottom:20 }}>
              <div style={{ color:'#ffffff66', fontSize:11, letterSpacing:2, textTransform:'uppercase', marginBottom:4 }}>Killcode (voor schutter bij eliminatie)</div>
              <div style={{ color:RD, fontSize:26, fontWeight:'bold', letterSpacing:4 }}>{toonPopup.killcode}</div>
            </div>
            <p style={{ color:'#ffffff44', fontSize:12, marginBottom:20 }}>⚠️ Geef de <strong style={{color:AC}}>toegangscode</strong> aan de deelnemer zelf.<br/>De <strong style={{color:RD}}>killcode</strong> pas NADAT ze geëlimineerd zijn.</p>
            <Btn onClick={()=>setToonPopup(null)} kleur={GR}>✓ Begrepen</Btn>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ borderBottom:'1px solid #ffffff22', display:'flex', paddingLeft:16, gap:0, overflowX:'auto' }}>
        {[['stats','📊 Stats'],['deelnemers',`👥 Deelnemers (${deelnemers.length})`],['loting','🎯 Loting'],['eliminaties','💀 Eliminaties'],isAdmin&&['preview','🔍 Preview'],isAdmin&&['whatsapp','📱 WhatsApp'],isAdmin&&['marshalls','👮 Marshalls']].filter(Boolean).map(([id,label]) =>
          <Tab key={id} label={label} actief={tab===id} onClick={()=>setTab(id)} />
        )}
      </div>

      <div style={{ maxWidth:820, margin:'0 auto', padding:'24px 16px' }}>

        {/* ── STATS ── */}
        {tab==='stats' && <>
          <Vak titel="📊 Statistieken bijwerken">
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12 }}>
              <Inp label="Totaal ingeschreven" type="number" value={totaal} onChange={setTotaal} min={0} />
              <Inp label="Nog actief" type="number" value={levenden} onChange={setLevenden} min={0} />
              <Inp label="Topschutter (# kills)" type="number" value={topschutter} onChange={setTopschutter} min={0} />
            </div>
            <Btn onClick={slaStatsOp} disabled={bezig} kleur={GR}>💾 Opslaan</Btn>
            <span style={{ marginLeft:12 }}>
              <Btn onClick={herstelTellers} disabled={bezig} kleur={OR} klein>🔄 Herbereken tellers</Btn>
            </span>
          </Vak>
          {isAdmin && <Vak titel="💧 Tijdlijn - manuele berichten" kleur={RD}>
            <p style={{ color:'#ffffff55', fontSize:12, marginTop:0, marginBottom:12 }}>
              Voeg hier manueel een bericht toe aan de publieke tijdlijn (bv. bij eliminaties zonder killcode). Automatische eliminaties via het tabblad 💀 verschijnen hier ook.
            </p>
            <Inp label="Bericht voor de publieke tijdlijn" value={nieuweElim} onChange={setNieuweElim} placeholder="bv. Een deelnemer werd geraakt aan het station..." />
            <div style={{ marginBottom:20 }}><Btn onClick={voegElimToe} disabled={bezig||!nieuweElim.trim()} kleur={RD}>💀 Toevoegen</Btn></div>
            {data?.tijdlijn?.map(item => (
              <div key={item.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid #ffffff11' }}>
                <div style={{ flex:1 }}>
                  <div style={{ color:WIT, fontSize:14 }}>{item.tekst}</div>
                  <div style={{ color:'#ffffff44', fontSize:11 }}>{new Date(item.tijdstip).toLocaleString('nl-BE')}</div>
                </div>
                <button onClick={()=>verwijderElim(item.id)} style={{ background:'none', border:`1px solid ${RD}`, color:RD, borderRadius:6, padding:'4px 10px', cursor:'pointer', fontSize:12 }}>✕</button>
              </div>
            ))}
          </Vak>}
        </>}

        {/* ── DEELNEMERS ── */}
        {tab==='deelnemers' && <>
          <Vak titel="➕ Nieuwe deelnemer" kleur={GR}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Inp label="Voornaam ★" value={nVn} onChange={setNVn} />
              <Inp label="Familienaam ★" value={nFn} onChange={setNFn} />
            </div>
            <Inp label="Adres" value={nAdres} onChange={setNAdres} placeholder="Straat nr, postcode gemeente" />
            <Inp label="E-mail / Tel" value={nContact} onChange={setNContact} />
            <Inp label="Notities" value={nNotitie} onChange={setNNotitie} />
            <div style={{ marginBottom:12 }}>
              <Label t="Foto (optioneel)" />
              <div style={{ display:'flex', gap:12, alignItems:'center' }}>
                <button type="button" onClick={()=>nFotoRef.current?.click()}
                  style={{ background:'#0a1628', border:'1px solid #ffffff22', borderRadius:8, padding:'9px 16px', color:nFoto?'#00B4D8':'#ffffff55', cursor:'pointer', fontSize:14 }}>
                  📷 {nFotoNaam || 'Kies foto...'}
                </button>
                {nFoto && <button type="button" onClick={()=>{setNFoto(null);setNFotoNaam('');}} style={{ background:'none', border:'none', color:'#C0392B', cursor:'pointer', fontSize:18 }}>✕</button>}
              </div>
              <input ref={nFotoRef} type="file" accept="image/*" style={{ display:'none' }}
                onChange={e=>{ if(e.target.files[0]){ setNFoto(e.target.files[0]); setNFotoNaam(e.target.files[0].name); }}} />
            </div>
            <Btn onClick={voegDeelnemerToe} disabled={bezig} kleur={GR}>➕ Toevoegen</Btn>
          </Vak>

          <Vak titel={`👥 Actieve deelnemers (${actief.length})`}>
            {actief.length===0
              ? <div style={{ color:'#ffffff33', fontStyle:'italic', textAlign:'center', padding:20 }}>Nog geen deelnemers</div>
              : actief.map(d => (
              <div key={d.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 0', borderBottom:'1px solid #ffffff11', flexWrap:'wrap' }}>
                {/* Foto */}
                <div style={{ width:48, height:56, background:`${BM}44`, borderRadius:8, border:`1px solid ${BM}`, overflow:'hidden', flexShrink:0, cursor:'pointer', position:'relative' }}
                  onClick={()=>fotoRef.current[d.id]?.click()}>
                  {d.foto_url
                    ? <img src={d.foto_url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>📷</div>
                  }
                  {fotoBezig[d.id] && <div style={{ position:'absolute', inset:0, background:'#000000aa', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, color:WIT }}>...</div>}
                  <input ref={el=>fotoRef.current[d.id]=el} type="file" accept="image/*" style={{ display:'none' }}
                    onChange={e=>e.target.files[0]&&uploadFoto(d.id,e.target.files[0])} />
                </div>

                <div style={{ background:BM, color:WIT, borderRadius:8, padding:'4px 10px', fontSize:12, fontWeight:'bold', minWidth:36, textAlign:'center' }}>#{d.nummer}</div>
                <div style={{ flex:1, minWidth:140 }}>
                  <div style={{ color:WIT, fontWeight:'bold' }}>{d.voornaam} {d.familienaam}</div>
                  <div style={{ color:'#ffffff55', fontSize:12 }}>{d.adres}</div>
                  <div style={{ display:'flex', gap:12, marginTop:2 }}>
                    <span style={{ color:AC, fontSize:11 }}>🔑 {d.toegangscode}</span>
                    <span style={{ color:RD, fontSize:11 }}>💀 {d.killcode}</span>
                  </div>
                </div>
                {d.doelwit && <div style={{ color:RD, fontSize:12 }}>🎯 {d.doelwit.voornaam} {d.doelwit.familienaam}</div>}
                <Btn onClick={()=>verwijderDeelnemer(d.id,`${d.voornaam} ${d.familienaam}`)} kleur={RD} klein>✕</Btn>
              </div>
            ))}
            <p style={{ color:'#ffffff44', fontSize:12, marginTop:12 }}>📷 Klik op de fotovakje om een foto te uploaden.</p>
          </Vak>

          {geelim.length>0 && <Vak titel={`💀 Geëlimineerd (${geelim.length})`} kleur="#666">
            {geelim.map(d => (
              <div key={d.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 0', borderBottom:'1px solid #ffffff11', opacity:0.5 }}>
                <div style={{ background:'#333', color:WIT, borderRadius:8, padding:'4px 10px', fontSize:12, minWidth:36, textAlign:'center' }}>#{d.nummer}</div>
                <div style={{ color:'#ffffff88', textDecoration:'line-through' }}>{d.voornaam} {d.familienaam}</div>
              </div>
            ))}
          </Vak>}
        </>}

        {/* ── LOTING ── */}
        {tab==='loting' && <>
          {isAdmin && <Vak titel="🎲 Loting genereren" kleur={GD}>
            <p style={{ color:'#ffffff66', fontSize:13, marginTop:0 }}>{actief.length} actieve deelnemers.</p>
            {(() => {
              const spelGestart = data?.startDatum && new Date() >= new Date(data.startDatum);
              return <>
                {spelGestart && (
                  <div style={{ background:'#C0392B22', border:'1px solid #C0392B', borderRadius:10, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#C0392B' }}>
                    ⚠️ Het spel is al gestart — de loting kan niet meer gewijzigd worden.
                  </div>
                )}
                <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:16 }}>
                  <Btn onClick={()=>genereerLoting(false)} disabled={bezig||actief.length<3||spelGestart} kleur={GD}>🎲 Genereer loting</Btn>
                  <Btn onClick={()=>genereerLoting(true)} disabled={bezig||actief.length<3} kleur={OR}>🧪 Test-loting</Btn>
                  <Btn onClick={valideerKetting} disabled={bezig} kleur={BM}>🔗 Valideer ketting</Btn>
                </div>
              </>;
            })()}
            {lotingStatus && (
              <div style={{ background:lotingStatus.geldig?GL:RL, borderRadius:10, padding:16 }}>
                <div style={{ color:lotingStatus.geldig?GR:RD, fontWeight:'bold', marginBottom:6 }}>
                  {lotingStatus.geldig?'✅ Ketting is geldig!':`❌ ${lotingStatus.fouten.length} probleem(en)`}
                </div>
                {!lotingStatus.geldig && lotingStatus.fouten.map((f,i)=><div key={i} style={{ color:RD, fontSize:13 }}>• {f}</div>)}
              </div>
            )}
          </Vak>}

          {testLotingPreview && (
            <Vak titel="🧪 Test-loting preview (niet opgeslagen)" kleur={OR}>
              <p style={{ color:'#ffffff66', fontSize:13, marginTop:0 }}>
                Dit is een voorbeeldkoppeling — nog niet actief. Klik op "Genereer loting" om de echte loting te starten.
              </p>
              <div style={{ marginBottom:12 }}>
                <Btn onClick={()=>setTestLotingPreview(null)} kleur="#333" klein>✕ Sluit preview</Btn>
              </div>
              {testLotingPreview.map((r, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 0', borderBottom:'1px solid #ffffff11', flexWrap:'wrap' }}>
                  <div style={{ color:WIT, minWidth:180, fontSize:14 }}>{r.schutter_naam}</div>
                  <div style={{ color:AC }}>→</div>
                  <div style={{ color:OR, fontSize:14 }}>{r.doelwit_naam}</div>
                </div>
              ))}
            </Vak>
          )}


          <Vak titel="🔧 Marshall aanpassing - doelwitten wisselen (max. 3 per marshall)">
            <p style={{ color:'#ffffff66', fontSize:13, marginTop:0 }}>
              Wissel de doelwitten van 2 deelnemers. De ketting blijft gesloten. Elke marshall mag dit maximaal 3 keer doen.
            </p>
            <div style={{ color:WIT, fontSize:13, marginBottom:12 }}>
              Marshall: <strong style={{color:AC}}>{marshallInfo?.naam}</strong>
            </div>
            {marshallInfo && (() => {
              const gebruikt = marshallInfo?.aanpassingen || 0;
              const resterend = 3 - gebruikt;
              return (
                <div style={{ background: resterend > 0 ? '#1E844922' : '#C0392B22', border: `1px solid ${resterend > 0 ? GR : RD}`, borderRadius: 8, padding: '8px 14px', marginBottom: 16, fontSize: 13 }}>
                  <span style={{ color: resterend > 0 ? GR : RD, fontWeight: 'bold' }}>
                    {resterend > 0 ? `✅ ${resterend} van 3 aanpassingen resterend` : '❌ Limiet bereikt — geen aanpassingen meer mogelijk'}
                  </span>
                </div>
              );
            })()}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Sel label="Deelnemer 1" value={sw1} onChange={setSw1}>
                <option value="">Kies deelnemer...</option>
                {actief.map(d=><option key={d.id} value={d.id}>#{d.nummer} {d.voornaam} {d.familienaam}</option>)}
              </Sel>
              <Sel label="Deelnemer 2" value={sw2} onChange={setSw2}>
                <option value="">Kies deelnemer...</option>
                {actief.filter(d=>d.id!==Number(sw1)).map(d=><option key={d.id} value={d.id}>#{d.nummer} {d.voornaam} {d.familienaam}</option>)}
              </Sel>
            </div>
            {sw1 && sw2 && (() => {
              const d1 = actief.find(d=>d.id===Number(sw1));
              const d2 = actief.find(d=>d.id===Number(sw2));
              return d1 && d2 && d1.doelwit && d2.doelwit ? (
                <div style={{ background:'#0a162888', borderRadius:10, padding:12, marginBottom:16, fontSize:13, color:'#ffffff88' }}>
                  Na de wissel:<br/>
                  <span style={{color:WIT}}>{d1.voornaam} {d1.familienaam}</span> → <span style={{color:OR}}>{d2.doelwit.voornaam} {d2.doelwit.familienaam}</span><br/>
                  <span style={{color:WIT}}>{d2.voornaam} {d2.familienaam}</span> → <span style={{color:OR}}>{d1.doelwit.voornaam} {d1.doelwit.familienaam}</span>
                </div>
              ) : null;
            })()}
            <Btn onClick={switchViaMarshall} disabled={bezig||!sw1||!sw2||!marshallNaam.trim()} kleur={OR}>🔀 Wissel doelwitten</Btn>
          </Vak>

          <Vak titel="📋 Huidige koppelingen - volgorde ketting">
            {actief.filter(d=>d.doelwit).length===0
              ? <div style={{ color:'#ffffff33', fontStyle:'italic', textAlign:'center', padding:20 }}>Nog geen loting</div>
              : (() => {
                  // Bouw de ketting op door de volgorde te volgen
                  const metDoelwit = actief.filter(d=>d.doelwit);
                  if (metDoelwit.length === 0) return null;
                  const doelwitMap = {};
                  metDoelwit.forEach(d => { doelwitMap[d.id] = d; });
                  // Zoek startpunt: de eerste in de ketting
                  const doelwitIds = new Set(metDoelwit.map(d=>d.doelwit.id));
                  const start = metDoelwit.find(d=>!doelwitIds.has(d.id)) || metDoelwit[0];
                  // Volg de ketting
                  const geordend = [];
                  let huidig = start;
                  const bezocht = new Set();
                  while (huidig && !bezocht.has(huidig.id)) {
                    geordend.push(huidig);
                    bezocht.add(huidig.id);
                    huidig = doelwitMap[huidig.doelwit?.id];
                  }
                  // Voeg eventuele overgebleven deelnemers toe (buiten ketting)
                  metDoelwit.forEach(d => { if (!bezocht.has(d.id)) geordend.push(d); });
                  return geordend.map((d,i) => (
                    <div key={d.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 0', borderBottom:'1px solid #ffffff11', flexWrap:'wrap' }}>
                      <div style={{ color:'#ffffff44', fontSize:12, minWidth:20 }}>{i+1}</div>
                      <div style={{ color:WIT, minWidth:180, fontSize:14 }}>#{d.nummer} {d.voornaam} {d.familienaam}</div>
                      <div style={{ color:AC }}>→</div>
                      <div style={{ color:RD, fontSize:14 }}>{d.doelwit?`${d.doelwit.voornaam} ${d.doelwit.familienaam}`:<span style={{ color:'#ffffff33', fontStyle:'italic' }}>geen</span>}</div>
                    </div>
                  ));
                })()
            }
          </Vak>
        </>}

        {/* ── ELIMINATIES ── */}
        {tab==='eliminaties' && <>
          <Vak titel="🔑 Via killcode" kleur={GD}>
            <p style={{ color:'#ffffff66', fontSize:13, marginTop:0 }}>De schutter geeft de killcode van zijn slachtoffer in ter bevestiging.</p>
            <div style={{ display:'flex', gap:12, alignItems:'flex-end' }}>
              <div style={{ flex:1 }}>
                <Inp label="Killcode slachtoffer" value={killcodeInput} onChange={setKillcodeInput} placeholder="bv. ABX4Y2" />
              </div>
              <div style={{ marginBottom:12 }}>
                <Btn onClick={controleerKillcode} disabled={bezig||!killcodeInput.trim()} kleur={GD}>🔍 Controleer</Btn>
              </div>
            </div>
            {killcodeResult && !killcodeResult.fout && (
              <div style={{ background:GL, borderRadius:12, padding:16, marginTop:8 }}>
                <div style={{ color:GR, fontWeight:'bold', marginBottom:12 }}>✅ Killcode geldig — slachtoffer: <strong>{killcodeResult.slachtoffer.naam}</strong></div>
                <Inp label="Omschrijving voor tijdlijn (optioneel)" value={elimTekst} onChange={setElimTekst} placeholder="bv. Geraakt aan het station" />
                <Btn onClick={()=>bevestigElim(killcodeResult.slachtoffer.id, true)} disabled={bezig} kleur={RD}>💀 Bevestig eliminatie</Btn>
              </div>
            )}
            {killcodeResult?.fout && <div style={{ color:RD, background:RL, borderRadius:10, padding:12, marginTop:8 }}>❌ {killcodeResult.fout}</div>}
          </Vak>

          <Vak titel="⚙️ Manueel (marshall)" kleur={OR}>
            <p style={{ color:'#ffffff66', fontSize:13, marginTop:0 }}>Zonder killcode — voor betwiste gevallen of marshall-beslissing.</p>
            <Sel label="Geëlimineerde deelnemer" value={elimD} onChange={setElimD}>
              <option value="">Kies deelnemer...</option>
              {actief.map(d=><option key={d.id} value={d.id}>#{d.nummer} {d.voornaam} {d.familienaam}</option>)}
            </Sel>
            <Inp label="Omschrijving (optioneel)" value={elimTekst} onChange={setElimTekst} placeholder="bv. Betwist geval beslecht door marshall" />
            <Btn onClick={()=>bevestigElim(Number(elimD), false)} disabled={bezig||!elimD} kleur={RD}>💀 Elimineer</Btn>
          </Vak>
        </>}

        {/* ── WHATSAPP ── */}
        {tab==='whatsapp' && <>
          <Vak titel="📱 WhatsApp via Twilio - instellingen">
            <div style={{ background:'#0a162888', borderRadius:12, padding:16, marginBottom:20, border:'1px solid #ffffff22' }}>
              <p style={{ color:GD, fontWeight:'bold', fontSize:13, margin:'0 0 10px' }}>
                Stap 1: Sandbox activeren
              </p>
              <p style={{ color:'#ffffff88', fontSize:13, margin:'0 0 8px' }}>
                Stuur vanuit WhatsApp het volgende bericht naar <strong style={{color:WIT}}>+1 415 523 8886</strong>:
              </p>
              <div style={{ background:'#000000aa', padding:12, borderRadius:8, color:AC, fontSize:14, fontFamily:'monospace', marginBottom:12 }}>
                join silver-tiger
              </div>
              <p style={{ color:'#ffffff55', fontSize:12, margin:0 }}>
                ⚠️ Elke deelnemer die berichten wil ontvangen moet dit eenmalig zelf doen (sandbox beperking).
                Voor productie zonder deze stap: upgrade je Twilio account.
              </p>
            </div>

            <div style={{ background:'#0a162888', borderRadius:12, padding:16, marginBottom:20, border:'1px solid #ffffff22' }}>
              <p style={{ color:GD, fontWeight:'bold', fontSize:13, margin:'0 0 10px' }}>
                Stap 2: Variabelen in Vercel instellen
              </p>
              <p style={{ color:'#ffffff88', fontSize:13, margin:'0 0 8px' }}>
                Ga naar Vercel → Settings → Environment Variables en voeg toe:
              </p>
              <code style={{ display:'block', background:'#000000aa', padding:12, borderRadius:8, fontSize:12, color:AC, lineHeight:2.2 }}>
                TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx<br/>
                TWILIO_AUTH_TOKEN=jouw_auth_token<br/>
                TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
              </code>
            </div>
          </Vak>

          <Vak titel="📞 Marshall telefoonnummers" kleur={GR}>
            <p style={{ color:'#ffffff66', fontSize:13, marginTop:0 }}>
              Telefoonnummers worden beheerd via het tabblad 👮 Marshalls. Voeg daar een telefoonnummer toe per marshall.
            </p>
            <div style={{ background:'#0a162888', borderRadius:10, padding:14, fontSize:13 }}>
              {marshallLijst.filter(m=>m.telefoon).length === 0
                ? <div style={{ color:'#ffffff33', fontStyle:'italic' }}>Nog geen telefoonnummers ingesteld bij marshalls.</div>
                : marshallLijst.filter(m=>m.telefoon).map(m => (
                  <div key={m.id} style={{ color:WIT, padding:'4px 0', borderBottom:'1px solid #ffffff11' }}>
                    <span style={{ color:AC }}>{m.naam}</span> — {m.telefoon}
                  </div>
                ))
              }
            </div>
          </Vak>

          <Vak titel="🧪 Testberichten - enkel naar marshalls" kleur={OR}>
            <p style={{ color:'#ffffff66', fontSize:13, marginTop:0 }}>
              Alle testberichten worden <strong style={{color:WIT}}>enkel naar marshalls</strong> gestuurd — nooit naar deelnemers. De tekst bevat [TEST] zodat het duidelijk is.
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <Btn onClick={()=>testWaType('kill_publiek')} disabled={waBezig} kleur={OR} klein>📤 Test kill (zoals deelnemers het zien)</Btn>
                <span style={{ color:'#ffffff44', fontSize:12 }}>ziet er zo uit voor deelnemers</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <Btn onClick={()=>testWaType('kill_marshall')} disabled={waBezig} kleur={OR} klein>📤 Test kill (zoals marshalls het zien)</Btn>
                <span style={{ color:'#ffffff44', fontSize:12 }}>met namen en details</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <Btn onClick={()=>testWaType('start')} disabled={waBezig} kleur={OR} klein>📤 Test startbericht (zoals deelnemers het zien)</Btn>
                <span style={{ color:'#ffffff44', fontSize:12 }}>met voorbeeld code en killcode</span>
              </div>
            </div>
          </Vak>

          <Vak titel="⏰ Automatisch startbericht (cron job)" kleur={AC}>
            <div style={{ background:'#0a162888', borderRadius:12, padding:16, fontSize:13 }}>
              <p style={{ color:WIT, fontWeight:'bold', margin:'0 0 10px' }}>Wat gebeurt er automatisch op 12 juli om middernacht?</p>
              <div style={{ display:'flex', flexDirection:'column', gap:8, color:'#ffffffcc' }}>
                <div>✅ Elke actieve deelnemer ontvangt een persoonlijk WhatsApp bericht met zijn toegangscode, killcode en de link naar de app</div>
                <div>✅ Alle marshalls ontvangen een bericht dat het spel gestart is met de link naar de admin pagina</div>
                <div>✅ De tijdlijn wordt automatisch bijgewerkt met "Het spel is gestart"</div>
                <div>✅ Als de berichten al verstuurd waren, doet de cron niets meer</div>
              </div>
              <div style={{ marginTop:12, color:'#ffffff55', fontSize:12 }}>
                ⚠️ Vercel kan de cron tot 59 minuten later uitvoeren — berichten kunnen dus aankomen tussen 00:00 en 00:59.
              </div>
            </div>
          </Vak>

          <Vak titel="🔁 Kill berichten opnieuw versturen" kleur={RD}>
            <p style={{ color:'#ffffff66', fontSize:13, marginTop:0 }}>
              Kies een kill en verstuur het bericht opnieuw. Deelnemers krijgen een anoniem bericht, marshalls krijgen alle details.
            </p>
            {killsLijst.length === 0
              ? <div style={{ color:'#ffffff33', fontStyle:'italic' }}>Nog geen kills geregistreerd.</div>
              : killsLijst.map(kill => (
                <div key={kill.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid #ffffff11', flexWrap:'wrap' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ color:WIT, fontSize:14, fontWeight:'bold' }}>💀 {kill.slachtoffer}</div>
                    <div style={{ color:'#ffffff66', fontSize:13 }}>Uitgeschakeld door: {kill.schutter}</div>
                    <div style={{ color:'#ffffff44', fontSize:11, marginTop:2 }}>{new Date(kill.tijdstip).toLocaleString('nl-BE')}</div>
                    <div style={{ color:'#ffffff44', fontSize:11, marginTop:2 }}>
                      📢 Deelnemers ontvangen: naam slachtoffer + aantal actieve spelers<br/>
                      👮 Marshalls ontvangen: slachtoffer + schutter + tijdstip
                    </div>
                  </div>
                  <Btn
                    onClick={async () => {
                      setHerversturBezig(true);
                      const { res, json } = await api('/api/notificaties', {
                        schutter: kill.schutter,
                        slachtoffer: kill.slachtoffer,
                        nieuwDoelwit: '',
                        tijdstip: kill.tijdstip,
                      });
                      if (res.ok) toonMelding(`✅ Verstuurd! Deelnemers: ${json.deelnemers?.verzonden || 0}, Marshalls: ${json.marshalls?.verzonden || 0}`);
                      else toonMelding(`❌ ${json.error || 'Fout'}`, 'fout');
                      setHerversturBezig(false);
                    }}
                    disabled={herversturBezig}
                    kleur={RD}
                    klein
                  >
                    🔁 Verstuur
                  </Btn>
                </div>
              ))
            }
          </Vak>

          <Vak titel="🚀 Startbericht manueel versturen" kleur={GR}>
            <p style={{ color:'#ffffff66', fontSize:13, marginTop:0 }}>
              Stuur aan elke deelnemer zijn persoonlijke toegangscode, killcode en de link naar de app. Doe dit eenmalig bij de officiële start van het spel.
            </p>
            <Btn onClick={stuurStartBerichtenAlle} disabled={waBezig} kleur={GR}>🚀 Stuur startbericht naar alle deelnemers</Btn>
            <p style={{ color:'#ffffff33', fontSize:11, marginTop:10 }}>
              ⚠️ Dit stuurt een persoonlijk bericht naar alle actieve deelnemers én marshalls. Gebruik enkel als de automatische cron gefaald heeft.
            </p>
          </Vak>
        </>}

        {/* ── MARSHALLS ── */}
        {tab==='marshalls' && isAdmin && <>
          <Vak titel="👮 Marshalls beheren" kleur={OR}>
            <p style={{ color:'#ffffff66', fontSize:13, marginTop:0 }}>Voeg marshalls toe met een eigen naam en wachtwoord. Elke marshall kan max. 3 doelwitten wisselen.</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <Inp label="Naam" value={nieuwMarshallNaam} onChange={setNieuwMarshallNaam} placeholder="bv. Denis" />
              <Inp label="Wachtwoord" value={nieuwMarshallWw} onChange={setNieuwMarshallWw} placeholder="geheim wachtwoord" />
            </div>
            <Inp label="Telefoonnummer (voor WhatsApp notificaties)" value={nieuwMarshallTel} onChange={setNieuwMarshallTel} placeholder="+32471112233 of 0471112233" />
            <label style={{ display:'flex', alignItems:'center', gap:8, color:WIT, fontSize:13, marginBottom:12, cursor:'pointer' }}>
              <input type="checkbox" checked={nieuwMarshallIsAdmin} onChange={e=>setNieuwMarshallIsAdmin(e.target.checked)} style={{ width:16, height:16 }} />
              Admin rechten (toegang tot alle functies)
            </label>
            <Btn onClick={voegMarshallToe} disabled={bezig} kleur={GR}>➕ Marshall toevoegen</Btn>
          </Vak>

          <Vak titel="📋 Overzicht marshalls">
            {marshallLijst.length === 0
              ? <div style={{ color:'#ffffff33', fontStyle:'italic', textAlign:'center', padding:20 }}>Nog geen marshalls aangemaakt</div>
              : marshallLijst.map(m => (
                <div key={m.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderBottom:'1px solid #ffffff11', flexWrap:'wrap' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ color:WIT, fontWeight:'bold' }}>{m.naam}</div>
                      {m.is_admin && <span style={{ background:GD, color:'#000', borderRadius:10, padding:'1px 8px', fontSize:11, fontWeight:'bold' }}>ADMIN</span>}
                    </div>
                    {m.telefoon && <div style={{ color:'#ffffff55', fontSize:12 }}>{m.telefoon}</div>}
                    <div style={{ marginTop:4 }}>
                      <span style={{ background: m.aanpassingen < 3 ? '#1E844922' : '#C0392B22', border:`1px solid ${m.aanpassingen < 3 ? GR : RD}`, borderRadius:20, padding:'2px 10px', fontSize:12, color: m.aanpassingen < 3 ? GR : RD }}>
                        {m.aanpassingen}/3 aanpassingen gebruikt
                      </span>
                    </div>
                  </div>
                  <Btn onClick={()=>toggleAdmin(m.id, m.is_admin)} kleur={m.is_admin?GD:BM} klein>{m.is_admin?'⭐ Admin':'Maak admin'}</Btn>
                  <Btn onClick={()=>resetMarshallAanpassingen(m.id, m.naam)} kleur={OR} klein>🔄 Reset</Btn>
                  <Btn onClick={()=>verwijderMarshall(m.id)} kleur={RD} klein>✕</Btn>
                </div>
              ))
            }
          </Vak>
        </>}

        {/* ── PREVIEW ── */}
        {tab==='preview' && isAdmin && <>
          <Vak titel="🔍 Preview doelwitpagina per deelnemer">
            <p style={{ color:'#ffffff66', fontSize:13, marginTop:0 }}>
              Klik op een deelnemer om te zien hoe zijn/haar doelwitpagina eruitziet. Opent in een nieuw tabblad.
            </p>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
              <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', color:WIT, fontSize:13 }}>
                <input type="checkbox" checked={previewForceGestart} onChange={e=>setPreviewForceGestart(e.target.checked)}
                  style={{ width:16, height:16, cursor:'pointer' }} />
                Bekijk als spel al gestart is (toont doelwit)
              </label>
            </div>
            {deelnemers.length === 0
              ? <div style={{ color:'#ffffff33', fontStyle:'italic', textAlign:'center', padding:20 }}>Geen deelnemers</div>
              : deelnemers.map(d => (
                <div key={d.id}
                  onClick={() => window.open('/mijn-doelwit?code=' + encodeURIComponent(d.toegangscode) + (previewForceGestart ? '&forceGestart=1' : ''), '_blank')}
                  style={{ display:'flex', alignItems:'center', gap:12, padding:'12px', marginBottom:8, background:'#0a162888', borderRadius:10, border:'1px solid #ffffff22', cursor:'pointer' }}
                  onMouseOver={e=>e.currentTarget.style.borderColor=AC}
                  onMouseOut={e=>e.currentTarget.style.borderColor='#ffffff22'}
                >
                  {d.foto_url && <img src={d.foto_url} alt="" style={{ width:36, height:42, objectFit:'cover', borderRadius:6, flexShrink:0 }} />}
                  <div style={{ background:d.status==='actief'?BM:'#333', color:WIT, borderRadius:8, padding:'4px 10px', fontSize:12, fontWeight:'bold', minWidth:36, textAlign:'center' }}>
                    #{d.nummer}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ color:d.status==='actief'?WIT:'#888', fontWeight:'bold', textDecoration:d.status==='geëlimineerd'?'line-through':'none' }}>
                      {d.voornaam} {d.familienaam}
                    </div>
                    <div style={{ color:AC, fontSize:11 }}>🔑 {d.toegangscode}</div>
                  </div>
                  {d.doelwit && <div style={{ color:RD, fontSize:13 }}>🎯 {d.doelwit.voornaam} {d.doelwit.familienaam}</div>}
                  <div style={{ color:'#ffffff33', fontSize:12 }}>Bekijk →</div>
                </div>
              ))
            }
          </Vak>
        </>}
      </div>
    </div>
  );
}
