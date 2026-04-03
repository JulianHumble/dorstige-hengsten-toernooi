# 🐴 Het Dorstige Hengsten Toernooi 2026

Een realtime bierproeverij-webapp met paardenthema! Host een blinde proeverij, laat deelnemers raden welk bier ze proeven, en bekijk live wie de slimste hengst is.

## Features

- **Realtime multiplayer** — deelnemers joinen via een 6-cijferige code
- **Blinde proeverij** — deelnemers zien alleen de beschrijving, niet de naam
- **Live updates** — zie direct wat anderen gokken via Supabase Realtime
- **Mobile-first** — geoptimaliseerd voor gebruik op telefoon
- **Paardenthema** — western-saloon sfeer met hoefijzer-animaties

## Tech Stack

- **Next.js** (App Router) + TypeScript
- **Supabase** (Realtime + Postgres)
- **Tailwind CSS**

## Setup

### 1. Supabase project aanmaken

1. Ga naar [supabase.com](https://supabase.com) en maak een gratis project aan
2. Ga naar de **SQL Editor** in je Supabase dashboard
3. Kopieer de inhoud van `supabase/migrations/001_init.sql` en voer het uit
4. Ga naar **Settings > API** en kopieer je Project URL en `anon` public key

### 2. Environment variabelen

Kopieer `.env.example` naar `.env.local`:

```bash
cp .env.example .env.local
```

Vul je Supabase gegevens in:

```
NEXT_PUBLIC_SUPABASE_URL=https://jouw-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=jouw-anon-key
```

### 3. Installeren en starten

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in je browser.

### 4. Deployen naar Vercel

1. Push je code naar GitHub
2. Importeer het project in [Vercel](https://vercel.com)
3. Voeg de environment variabelen toe in Vercel's dashboard
4. Deploy!

## Hoe het werkt

1. **Stalmeester** (host) maakt een nieuw toernooi aan met 8 vooringevulde bieren
2. **Deelnemers** joinen via de 6-cijferige code
3. Per bier zien deelnemers alleen de beschrijving en kiezen welk bier ze denken dat het is
4. Na elke ronde onthult de host het juiste antwoord
5. Aan het eind wordt de **Hengst van de Avond** gekroond! 🏆

## De 8 standaard bieren

| # | Brouwerij | Bier |
|---|-----------|------|
| 1 | De Moersleutel | Crank the Spring 2026 |
| 2 | Brouwerij 't IJ | Paasij |
| 3 | Brouwerij Kees | Mosaic Hop |
| 4 | Pohjala | Kosmos NEIPA |
| 5 | Brouwerij Boon | Oude Geuze Boon |
| 6 | Jopen | Zwarte Ziel 2026 |
| 7 | Stichting De Molen | Oester Stout |
| 8 | De Moersleutel | Motor Oil |
