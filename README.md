# Poll Summer — Favorite Season Poll + Support Portal

A Next.js + Supabase + Vercel app with two features:

1. **`/`** — Live "Favorite Season?" poll with real-time Supabase Realtime vote counts.
2. **`/support`** — Internal support chatbot (MEAL & Systems topics) powered by Claude, with escalation routing and logging.

---

## Quick start

```bash
cp .env.local.example .env.local
# fill in your Supabase URL, anon key, and Anthropic API key
npm install
npm run dev
```

Open http://localhost:3000.

---

## 1. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a new project, wait ~1 min.

## 2. Run the database schemas

In **Supabase → SQL Editor**, run these files in order:

### 2a. Poll schema (`supabase/schema.sql`)

Creates the `votes` table, RLS policies, Realtime publication, and `season_counts` view.

### 2b. Support schema (`supabase/support-schema.sql`)

Creates `support_knowledge` and `support_requests` tables, RLS policies, and seed data.

> The knowledge base is editable directly in the Supabase table editor — no redeploy needed. Add or edit rows in `support_knowledge` and the chatbot picks them up immediately.

## 3. Get your Supabase credentials

**Project Settings → API:**

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Never use the `service_role` key on the client.

## 4. Get your Anthropic API key

Sign in at [console.anthropic.com](https://console.anthropic.com), go to **API Keys**, and create one.

- Set `ANTHROPIC_API_KEY=sk-ant-...` in `.env.local` (server-side only — never prefix with `NEXT_PUBLIC_`).
- `CLAUDE_MODEL` defaults to `claude-sonnet-5`. Change it in `.env.local` to try other models.

## 5. Configure support contacts

Edit `lib/contacts.ts` to set names and roles. Override emails without a code change via env vars:

```env
MEAL_SUPPORT_EMAIL=stephanie@yourorg.com
SYSTEMS_SUPPORT_EMAIL=yousif@yourorg.com
```

## 6. Edit the knowledge base

Add, edit, or remove rows in the `support_knowledge` Supabase table:

| Column | Value |
|---|---|
| `topic` | `meal` or `systems` |
| `title` | Short heading for this piece of knowledge |
| `content` | The full text Claude will use to answer questions |

Changes are live immediately — no redeploy needed.

**Adding semantic search (optional, future):** Right now the API fetches all rows for the topic and injects them into the system prompt. For large knowledge bases, add an `embedding` column, generate embeddings via Supabase Edge Functions + pgvector, and replace the full-fetch with a vector similarity query.

## 7. Deploy to Vercel

1. Import from GitHub at [vercel.com/new](https://vercel.com/new).
2. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `ANTHROPIC_API_KEY`
   - `CLAUDE_MODEL` (optional)
   - `MEAL_SUPPORT_EMAIL` (optional)
   - `SYSTEMS_SUPPORT_EMAIL` (optional)
3. Deploy.

> `NEXT_PUBLIC_*` vars are embedded in the browser bundle — that's intentional. The anon key is safe to expose because RLS limits what it can do.

---

## Architecture

```
app/
  page.tsx                     ← Poll (client component, Supabase Realtime)
  support/
    page.tsx                   ← Topic selection
    chat/
      page.tsx                 ← Suspense wrapper
      ChatClient.tsx           ← Chat UI (streaming, escalation)
  api/support/
    chat/route.ts              ← Server: fetch knowledge + call Claude (streamed)
    escalate/route.ts          ← Server: log to support_requests, return contact

lib/
  supabaseClient.ts            ← Shared Supabase client (anon key)
  contacts.ts                  ← Support contact config (edit here)

supabase/
  schema.sql                   ← Poll: votes table, RLS, Realtime, season_counts view
  support-schema.sql           ← Support: knowledge + requests tables, RLS, seed data
```

**Security notes:**
- `ANTHROPIC_API_KEY` never leaves the server — the chat API route streams Claude's response to the client as plain text, so no key is exposed.
- The anon Supabase key is used everywhere. RLS policies allow anon SELECT on `support_knowledge` and anon INSERT on `votes` and `support_requests`. There is no sensitive data in any of these tables.
