'use client';

const BD = '#0D3B6E', AC = '#00B4D8', RD = '#C0392B', GD = '#F4D03F';
const WIT = '#FFFFFF';

const regels = [
  {
    nr: 1, icon: '🎯', titel: 'Jouw doelwit',
    tekst: 'Bij de start van het spel krijg je via de app één geheim doelwit toegewezen. Jij bent tegelijk ook het doelwit van een andere speler, zonder dat je weet wie dat is. Het doel is simpel: elimineer je doelwit voor je zelf geëlimineerd wordt.'
  },
  {
    nr: 2, icon: '🔫', titel: 'Hoe elimineer je iemand?',
    tekst: 'Je elimineert je doelwit door hem of haar nat te spuiten met een waterpistool. Jij moet zelf de trekker overhalen — een derde persoon inschakelen om te schieten is niet toegestaan en telt niet als geldige kill.'
  },
  {
    nr: 3, icon: '👥', titel: 'Alleen zijn is verplicht',
    tekst: 'Een eliminatie is enkel geldig als jij en je doelwit op dat moment alleen zijn. Van zodra er een derde persoon aanwezig is — wie dan ook — geldt de aanval niet en mag je doelwit gewoon verder.'
  },
  {
    nr: 4, icon: '🔗', titel: 'De ketting gaat verder',
    tekst: 'Zodra je je doelwit hebt geëlimineerd, neem je diens volgende doelwit over. Zo blijft de ketting gesloten en loopt het spel door. Je ontvangt via de app de gegevens van je nieuwe doelwit.'
  },
  {
    nr: 5, icon: '🔑', titel: 'Killcode ter bevestiging',
    tekst: 'Elke speler heeft een geheime killcode. Na een eliminatie kan de kill op drie manieren bevestigd worden: je geeft de killcode van je slachtoffer zelf in via de app, je stuurt hem door naar de marshall, of de marshall registreert de kill manueel. Zo wordt de eliminatie officieel en krijgt iedereen een melding.'
  },
  {
    nr: 6, icon: '🥽', titel: 'De duikbril als schild',
    tekst: 'Draag je de officiële duikbril met de glazen volledig over je ogen? Dan ben je tijdelijk beschermd en mag niemand je aanvallen. Let op: de bril op je hoofd dragen of om je nek hangen telt niet — alleen over de ogen.'
  },
  {
    nr: 7, icon: '🏠', titel: 'Veilige zones',
    tekst: 'Café NOBIS en Café NOBIS The Pool zijn veilige zones. Binnen deze locaties — en aan de ingang ervan — kan niemand worden aangevallen of geëlimineerd. Zodra je de deur uit stapt, ben je opnieuw in het spel.'
  },
  {
    nr: 8, icon: '⚖️', titel: 'De marshall beslist',
    tekst: 'De marshall is de officiële scheidsrechter van het spel. Bij betwiste situaties, twijfelgevallen of overtredingen beslist de marshall definitief. Zijn of haar beslissing is onherroepelijk en voor iedereen bindend.'
  },
  {
    nr: 9, icon: '📅', titel: 'Speelperiode',
    tekst: 'Het spel loopt van 12 juli tot en met 20 september 2026. Eliminaties buiten deze periode tellen niet mee. Wie op 20 september nog actief is, is officieel een overlevende.'
  },
  {
    nr: 10, icon: '🏆', titel: 'De winnaar',
    tekst: 'Het spel eindigt wanneer er nog één speler overblijft. Die persoon is de winnaar van Summer Gotcha 2026. Kijk goed om je heen, vertrouw niemand blindelings, en veel succes.'
  },
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
            border: `1px solid ${i % 3 === 0 ? AC + '44' : '#ffffff15'}`,
            borderRadius: 14, padding: '20px 24px',
          }}>
            {/* Nummer */}
            <div style={{ flexShrink: 0, width: 48, height: 48, borderRadius: '50%', background: `linear-gradient(135deg, ${BD}, ${AC}44)`, border: `2px solid ${AC}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 'bold', color: AC }}>
              {r.nr}
            </div>
            {/* Tekst */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>{r.icon}</span>
                <span style={{ color: WIT, fontWeight: 'bold', fontSize: 16 }}>{r.titel}</span>
              </div>
              <p style={{ color: '#ffffffcc', fontSize: 14, margin: 0, lineHeight: 1.7 }}>{r.tekst}</p>
            </div>
          </div>
        ))}

        {/* Onthoud altijd */}
        <div style={{ background: `linear-gradient(135deg, ${BD}cc, #1a0a2ecc)`, border: `2px solid ${GD}`, borderRadius: 14, padding: '20px 24px', marginTop: 8, marginBottom: 32 }}>
          <div style={{ color: GD, fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 14 }}>⚠️ Onthoud altijd</div>
          {[
            'Je moet alleen zijn met je doelwit bij de aanval.',
            'Alleen een waterpistool is toegestaan — niets anders.',
            'Duikbril over de ogen betekent beschermd.',
            'Café NOBIS en NOBIS The Pool zijn altijd veilig.',
            'De marshall beslist — altijd en definitief.',
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
              <span style={{ color: GD, fontSize: 14, marginTop: 2, flexShrink: 0 }}>★</span>
              <span style={{ color: '#ffffffcc', fontSize: 14, lineHeight: 1.5 }}>{item}</span>
            </div>
          ))}
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
