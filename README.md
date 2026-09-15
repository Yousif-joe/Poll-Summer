# Favorite Season Poll

A live single-page poll — "What's your favorite season?" — built with Next.js, Supabase Realtime, and Tailwind CSS. Votes update for all viewers instantly without a page refresh.

## Features

- One vote per browser/device (UUID stored in `localStorage`, `unique` constraint in DB)
- Results hidden until you vote
- Live counters via Supabase Realtime (no polling)
- Anonymous — no login required

---

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Wait for the project to finish provisioning (takes ~1 minute).

## 2. Run the database schema

1. In the Supabase dashboard, open **SQL Editor**.
2. Paste the contents of [`supabase/schema.sql`](./supabase/schema.sql) and run it.

This creates the `votes` table, enables RLS with anon INSERT/SELECT policies, adds the table to the Realtime publication, and creates a `season_counts` view for efficient count fetching.

> **Why a view instead of fetching all rows?**  
> A `GROUP BY` view lets the client fetch four aggregated rows instead of potentially thousands of raw vote rows — simpler and cheaper than either client-side aggregation or an RPC function.

## 3. Get your Supabase credentials

In the Supabase dashboard → **Project Settings → API**:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Never use the `service_role` key on the client.

## 4. Set up local environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in your URL and anon key.

## 5. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 6. Push to GitHub

```bash
git add .
git commit -m "feat: favorite season poll"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## 7. Deploy to Vercel

1. Import the GitHub repository at [vercel.com/new](https://vercel.com/new).
2. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Click **Deploy**.

> The `NEXT_PUBLIC_` prefix means these values are embedded in the client bundle — that's intentional. The anon key is safe to expose because RLS restricts what it can do.
