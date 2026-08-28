'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  pushOndersteund,
  huidigeStatus,
  activeerPush,
  deactiveerPush,
  testPush,
  isIOS,
  isStandalone,
} from '../../lib/push-client';

// auth = { toegangscode } (deelnemer) of { wachtwoord } (marshall)
export default function PushKnop({ auth, compact = false }) {
  const [status, setStatus] = useState('laden'); // laden|aan|uit|geblokkeerd|niet-ondersteund
  const [bezig, setBezig] = useState(false);
  const [fout, setFout] = useState('');
  const [melding, setMelding] = useState('');

  const ververs = useCallback(async () => {
    try {
      setStatus(await huidigeStatus());
    } catch {
      setStatus('niet-ondersteund');
    }
  }, []);

  useEffect(() => { ververs(); }, [ververs]);

  async function aanzetten() {
    setBezig(true); setFout(''); setMelding('');
    try {
      await activeerPush(auth);
      setMelding('✅ Meldingen staan aan op dit toestel.');
      await ververs();
    } catch (e) {
      setFout(e.message || 'Er ging iets mis.');
    } finally {
      setBezig(false);
    }
  }

  async function uitzetten() {
    setBezig(true); setFout(''); setMelding('');
    try {
      await deactiveerPush();
      await ververs();
    } catch (e) {
      setFout(e.message || 'Er ging iets mis.');
    } finally {
      setBezig(false);
    }
  }

  async function test() {
    setBezig(true); setFout(''); setMelding('');
    try {
      const r = await testPush(auth);
      setMelding(r.verzonden > 0 ? '📨 Testmelding verstuurd.' : 'Geen toestel om naar te sturen.');
    } catch (e) {
      setFout(e.message || 'Testmelding mislukt.');
    } finally {
      setBezig(false);
    }
  }

  const iosZonderPwa = isIOS() && !isStandalone();

  const box = {
    background: '#0a162888',
    border: '1px solid #ffffff22',
    borderRadius: 12,
    padding: compact ? 14 : 18,
    marginBottom: 16,
  };
  const knop = (kleur, disabled) => ({
    background: disabled ? '#333' : kleur,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '9px 16px',
    fontSize: 14,
    fontWeight: 'bold',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
  });

  if (status === 'laden') return null;

  if (status === 'niet-ondersteund') {
    return (
      <div style={box}>
        <div style={{ color: '#ffffff88', fontSize: 13 }}>
          🔔 Gratis meldingen worden niet ondersteund in deze browser.
          {isIOS() && ' Op iPhone: open de site in Safari en kies "Deel → Zet op beginscherm".'}
        </div>
      </div>
    );
  }

  return (
    <div style={box}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>
            🔔 Gratis meldingen {status === 'aan' ? '— aan' : ''}
          </div>
          <div style={{ color: '#ffffff77', fontSize: 12, marginTop: 2 }}>
            Kills, herschommelingen en de start — rechtstreeks op dit toestel, naast WhatsApp.
          </div>
        </div>
        {status === 'aan' ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={test} disabled={bezig} style={knop('#1A6B9E', bezig)}>Test</button>
            <button onClick={uitzetten} disabled={bezig} style={knop('#555', bezig)}>Uitzetten</button>
          </div>
        ) : (
          <button onClick={aanzetten} disabled={bezig || status === 'geblokkeerd'} style={knop('#00B4D8', bezig || status === 'geblokkeerd')}>
            {bezig ? 'Bezig…' : '🔔 Zet meldingen aan'}
          </button>
        )}
      </div>

      {status === 'geblokkeerd' && (
        <div style={{ color: '#E67E22', fontSize: 12, marginTop: 8 }}>
          Meldingen staan geblokkeerd voor deze site. Zet ze aan via het slotje/instellingen van je browser.
        </div>
      )}
      {iosZonderPwa && status !== 'aan' && (
        <div style={{ color: '#F4D03F', fontSize: 12, marginTop: 8 }}>
          📱 Op iPhone werkt dit enkel als PWA: open in Safari → Deel → "Zet op beginscherm", en open daarna de app-icoon.
        </div>
      )}
      {melding && <div style={{ color: '#1E8449', fontSize: 12, marginTop: 8 }}>{melding}</div>}
      {fout && <div style={{ color: '#C0392B', fontSize: 12, marginTop: 8 }}>❌ {fout}</div>}
    </div>
  );
}
