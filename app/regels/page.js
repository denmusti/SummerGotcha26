'use client';

const BD = '#0D3B6E', AC = '#00B4D8', RD = '#C0392B', GD = '#F4D03F';
const WIT = '#FFFFFF';

const regels = [
  { nr: 1, icon: '🎯', titel: 'Eén doelwit', tekst: 'Elke speler krijgt één geheim doelwit toegewezen via loting. Jij bent tegelijk ook het doelwit van iemand anders.' },
  { nr: 2, icon: '🔫', titel: 'Eliminatie', tekst: 'Je elimineert je doelwit door hem of haar nat te spuiten met een waterpistool. Jij moet zelf de trekker overhalen — iemand anders inschakelen is niet toegestaan.' },
  { nr: 3, icon: '👥', titel: 'Alleen zijn', tekst: 'Een eliminatie is enkel geldig als jij en je doelwit alleen zijn. Van zodra er een derde persoon aanwezig is, geldt de aanval niet.' },
  { nr: 4, icon: '🔑', titel: 'Killcode', tekst: 'Elke speler heeft een geheime killcode. Na een eliminatie geef je de killcode van je slachtoffer door aan de marshall ter bevestiging.' },
  { nr: 5, icon: '🔗', titel: 'Ketting', tekst: 'Na een kill neem je het doelwit van je slachtoffer over. Zo loopt het spel door tot er één speler overblijft.' },
  { nr: 6, icon: '🥽', titel: 'Duikbril', tekst: 'Draag je de officiële duikbril met de glazen over je ogen? Dan ben je tijdelijk beschermd. Op het hoofd of om de nek telt niet.' },
  { nr: 7, icon: '🏠', titel: 'Veilige zones', tekst: 'In Café NOBIS en Café NOBIS The Pool kan niemand worden geëlimineerd. Aanvallen aan de ingang zijn ook niet toegestaan.' },
  { nr: 8, icon: '⚖️', titel: 'Marshall', tekst: 'De marshall is de scheidsrechter. Bij twijfel of betwisting beslist de marshall definitief. Zijn beslissing is onherroepelijk.' },
  { nr: 9, icon: '📅', titel: 'Periode', tekst: 'Het spel loopt van 12 juli tot en met 20 september 2026. Eliminaties buiten deze periode tellen niet.' },
  { nr: 10, icon: '🏆', titel: 'Winnaar', tekst: 'De laatste overlevende wint het spel. Veel succes — en kijk regelmatig achterom.' },
];

export default function RegelsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0a1628 0%, #0d2040 100%)', color: WIT, paddingBottom: 60 }}>

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${BD}, #0a1628)`, borderBottom: `3px solid ${AC}`, padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 12, letterSpacing: 4, color: AC, textTransform: 'uppercase', marginBottom: 8 }}>📋 Officiële spelregels</div>
        <h1 style={{ margin: 0, fontSize: 'clamp(26px, 5vw, 44px)', fontWeight: 'bold', letterSpacing: 2 }}>
          SUMMER <span style={{ color: AC }}>GOTCHA</span> 2026
        </h1>
        <p style={{ color: '#ffffff55', fontSize: 14, margin: '10px 0 0' }}>12 juli — 20 september 2026</p>
      </div>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 16px' }}>

        {regels.map((r, i) => (
          <div key={r.nr} style={{
            display: 'flex', gap: 20, marginBottom: 20,
            background: `linear-gradient(135deg, ${BD}aa, #0a1628aa)`,
            border: `1px solid ${i % 3 === 0 ? AC+'44' : '#ffffff15'}`,
            borderRadius: 14, padding: '20px 24px',
            boxShadow: i % 3 === 0 ? `0 0 15px ${AC}11` : 'none',
          }}>
            {/* Nummer */}
            <div style={{ flexShrink: 0, width: 48, height: 48, borderRadius: '50%', background: `linear-gradient(135deg, ${BD}, ${AC}44)`, border: `2px solid ${AC}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 'bold', color: AC }}>
              {r.nr}
            </div>
            {/* Tekst */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 20 }}>{r.icon}</span>
                <span style={{ color: WIT, fontWeight: 'bold', fontSize: 16 }}>{r.titel}</span>
              </div>
              <p style={{ color: '#ffffffcc', fontSize: 14, margin: 0, lineHeight: 1.6 }}>{r.tekst}</p>
            </div>
          </div>
        ))}

        {/* Veilige zones extra highlight */}
        <div style={{ background: `linear-gradient(135deg, ${BD}cc, #1a0a2ecc)`, border: `2px solid ${GD}`, borderRadius: 14, padding: '20px 24px', marginTop: 8, marginBottom: 32 }}>
          <div style={{ color: GD, fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>⚠️ Onthoud altijd</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['Alleen zijn bij de aanval', 'Waterpistool — niets anders', 'Duikbril over de ogen = veilig', 'NOBIS & NOBIS The Pool = veilige zone', 'Marshall beslist bij twijfel'].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: GD, fontSize: 16 }}>★</span>
                <span style={{ color: WIT, fontSize: 14 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer links */}
        <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
          <a href="/" style={{ color: AC, fontSize: 13, textDecoration: 'none' }}>← Overzicht</a>
          <a href="/mijn-doelwit" style={{ color: AC, fontSize: 13, textDecoration: 'none' }}>🎯 Mijn doelwit</a>
        </div>
      </div>
    </div>
  );
}
