# My Travel Map

Interactive, map-first travel portfolio built with Next.js (App Router), Tailwind CSS v4, Leaflet, marker clustering, and Framer Motion. **Your places are stored in the browser** (`localStorage` under `my-travel-map-places-v1`) so you can add and remove spots in the UI with no API keys. `src/data/places.json` ships empty and is optional seed data only.

## Prerequisites

- Node.js 20+ (matches Next.js 16 expectations)
- npm (ships with Node)

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The map bundle loads on the client only (Leaflet + clustering); you will see a short shimmer skeleton until tiles and markers are ready.

## Adding and editing picks

Use **Add place** in the header. Enter an address and use **Find**, or use **Drop pin on map** and click the map. Optional photos can be uploaded from your device, and a map link is built automatically from the saved location.

Open any pin to see details; **Remove from map** deletes it from your saved list.

Each place has this shape (IDs are assigned automatically when you save):

- `id`, `name`, `city`, `country`, `category` (`Food` | `Activities` | `Nightlife` | `Nature`)
- `lat`, `lng` (decimal degrees)
- `rating` (0–10)
- `description`
- `images` (URLs; extend `next.config.ts` `images.remotePatterns` if you use a new host)
- `mapLink` (map URL)

Data persists per browser profile. Clearing site data removes your list.

## Production build

```bash
npm run build
npm start
```

## Deploy to Vercel

1. Push this repository to GitHub (or GitLab / Bitbucket).
2. In the [Vercel dashboard](https://vercel.com/new), import the repository.
3. Vercel auto-detects Next.js: keep the default **Build Command** (`next build`) and **Output** settings.
4. Deploy. No environment variables are required for the static JSON setup.

Official reference: [Vercel — Deploying a Next.js app](https://vercel.com/docs/frameworks/nextjs).

## Project structure (high level)

- `src/app` — App Router entry, global styles, metadata
- `src/components/travel` — Map shell, filters, list, detail sheet, carousel
- `src/data/places.json` — empty seed (optional); runtime list lives in `localStorage`
- `src/lib` — types, category tokens, filtering helpers
