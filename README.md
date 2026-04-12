# Life OS

A frontend-only personal life management system built with Next.js 14 (App Router) and Tailwind CSS. Tracks prayers, tasks, workouts, diet, journaling, and daily progress — all stored locally in your browser with no backend required.

## Features

- **Dashboard** — daily score (out of 100), prayer progress, tasks, protein intake, gym status
- **Calendar** — day view with time slots, color-coded events by type (task, gym, meal, prayer, custom)
- **Namaz** — 5 daily prayers with pending / done / missed states
- **Gym** — workout logger with Push / Pull / Legs splits, exercises, sets, reps, and weight
- **Diet** — meal tracking with protein and calorie totals
- **Journal** — daily text entry with recent entry history
- **Progress** — weight logs, streak counters, weekly score summary

## Tech Stack

- [Next.js 14+](https://nextjs.org) (App Router, static export)
- [Tailwind CSS](https://tailwindcss.com)
- `localStorage` for all data persistence — no backend, no auth, no external APIs

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Building for Production

```bash
npm run build
```

This generates a static `out/` folder ready for deployment. The project is configured with `output: 'export'` in `next.config.js` for fully static Vercel deployment.

## Deploying to Vercel

Push to GitHub and import the repo on [Vercel](https://vercel.com). No environment variables or server configuration needed — it deploys as a static site out of the box.

## Data & Privacy

All data is stored in your browser's `localStorage` under the key `lifeOS`. Nothing is sent to any server. Clearing your browser data will erase your Life OS data.