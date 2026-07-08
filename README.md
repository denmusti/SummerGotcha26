# Summer Gotcha 2026 — Opvolgingssysteem

## Over het spel
Summer Gotcha 2026 is een waterpistool eliminatiespel dat loopt van 12 juli tot 20 september 2026.

## Technische stack
- **Frontend/Backend**: Next.js 14 op Vercel
- **Database**: Supabase (PostgreSQL)
- **Notificaties**: Twilio WhatsApp Business API
- **Opslag foto's**: Supabase Storage

## Pagina's

| URL | Beschrijving |
|-----|-------------|
| `/` | Publieke pagina — stats, afteltimer, tijdlijn |
| `/mijn-doelwit` | Deelnemerspagina — doelwit, killcode, kills |
| `/regels` | Officiële spelregels |
| `/admin` | Beheerpagina voor marshalls |

## Gebruikers & toegang

### Marshalls
- Loggen in via `/admin` met hun persoonlijk wachtwoord
- Kunnen deelnemers beheren, loting uitvoeren, kills registreren
- Hebben max. 3 doelwit-wissels

### Admin marshalls
- Hebben alle marshall-rechten + extra:
  - Marshalls beheren (toevoegen/verwijderen/admin rechten toekennen)
  - WhatsApp instellingen beheren
  - Statistieken bewerken
  - Preview deelnemerspagina's

### Deelnemers
- Loggen in via `/mijn-doelwit` met hun persoonlijke toegangscode
- Zien hun doelwit, eigen killcode en kills historiek
- Kunnen kills registreren via killcode van slachtoffer

## Omgevingsvariabelen (Vercel)

| Naam | Beschrijving |
|------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token |
| `TWILIO_WHATSAPP_FROM` | Twilio WhatsApp nummer (bv. `whatsapp:+15554581577`) |
| `TWILIO_TEMPLATE_SID` | Twilio Content Template SID |
| `NEXT_PUBLIC_APP_URL` | Publieke URL van de app |
| `CRON_SECRET` | Geheim wachtwoord voor de cron job |

## Database setup
Voer `supabase/volledig_setup.sql` uit in de Supabase SQL Editor voor een nieuwe opzet.

## Deployen
Push naar de `main` branch op GitHub — Vercel deployt automatisch.
