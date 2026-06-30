# Summer Gotcha 2026 — Opvolgingssysteem

## Deployen op Vercel + Supabase (stap voor stap)

### 1. Supabase project aanmaken
1. Ga naar https://supabase.com en log in (gratis account)
2. Klik **New Project** → kies een naam (bv. `summer-gotcha-2026`) en wachtwoord voor de database
3. Wacht tot het project klaar is (±2 min)

### 2. Database tabellen aanmaken
1. Ga in je Supabase project naar **SQL Editor**
2. Open het bestand `supabase/schema.sql` uit deze map
3. Plak de volledige inhoud in de SQL Editor en klik **Run**
4. Dit maakt 3 tabellen aan: `stats`, `tijdlijn`, `deelnemers`

### 3. API-sleutels ophalen
1. Ga naar **Project Settings → API**
2. Noteer:
   - **Project URL** → wordt `SUPABASE_URL`
   - **service_role key** (onder "Project API keys") → wordt `SUPABASE_SERVICE_ROLE_KEY`

   ⚠️ De **service_role key** geeft volledige schrijftoegang tot je database.
   Gebruik die NOOIT in browser-code — enkel in API routes (zoals deze app al doet).

### 4. Project deployen op Vercel
**Via GitHub (aangeraden):**
1. Push deze map naar een GitHub repository
2. Ga naar https://vercel.com/new → importeer je repo
3. Vercel detecteert Next.js automatisch
4. Voeg bij **Environment Variables** toe:
   ```
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   ```
5. Klik **Deploy**

**Via CLI:**
```bash
npm install
npx vercel env add SUPABASE_URL
npx vercel env add SUPABASE_SERVICE_ROLE_KEY
npx vercel --prod
```

---

## Lokaal testen

1. Maak een `.env.local` bestand aan in de hoofdmap:
   ```
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   ```
2. Installeer en start:
   ```bash
   npm install
   npm run dev
   ```
3. Open http://localhost:3000

---

## Wachtwoord wijzigen

Het wachtwoord staat in de `stats` tabel in Supabase. Wijzig het via:
1. Supabase → **Table Editor** → `stats` tabel
2. Pas de kolom `wachtwoord` aan in de enige rij (id = 1)

Of via SQL Editor:
```sql
update stats set wachtwoord = 'jouwNieuweWachtwoord' where id = 1;
```

---

## Pagina's

| URL | Beschrijving |
|-----|-------------|
| `/` | Publieke pagina — stats, afteltimer, tijdlijn |
| `/admin` | Beheerpagina voor marshalls (wachtwoord vereist) |

---

## Database structuur (Supabase / Postgres)

**Tabel `stats`** (1 rij, algemene gegevens)
| kolom | type | omschrijving |
|---|---|---|
| totaal_deelnemers | int | aantal ingeschreven |
| levenden | int | aantal nog actief |
| topschutter_aantal | int | meeste eliminaties (anoniem getoond) |
| start_datum / eind_datum | timestamptz | speelperiode |
| wachtwoord | text | toegang tot beheerpagina |

**Tabel `tijdlijn`** (eliminatiegeschiedenis)
| kolom | type |
|---|---|
| id | bigserial |
| tekst | text |
| tijdstip | timestamptz |

**Tabel `deelnemers`** (optioneel, voor toekomstige koppeling met het lotingsysteem)
| kolom | type |
|---|---|
| nummer, voornaam, familienaam, adres, foto, contact, notitie | — |
| status | 'actief' / 'geëlimineerd' |
| doelwit_id | verwijst naar een andere deelnemer |

Je kan deze tabel later rechtstreeks vullen vanuit je Google Sheets lotingsysteem
(bv. via een export-script), zodat de hele keten gekoppeld is.

---

## Beveiliging

- De browser communiceert nooit rechtstreeks met Supabase — alles loopt via de
  Next.js API routes (`/api/data`), die de `service_role` key server-side gebruiken.
- Row Level Security (RLS) staat aan op alle tabellen: enkel lezen is publiek
  toegestaan, schrijven kan alleen via de service role key (dus via onze server).
