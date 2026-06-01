# caloriq — deploy guide

## What you need
- A Supabase account (free tier is fine) — supabase.com
- A Vercel account (free tier is fine) — vercel.com
- A GitHub account (to connect to Vercel)
- Your Anthropic API key — console.anthropic.com

---

## Step 1 — Supabase: create project & tables

1. Go to supabase.com → New project. Name it "caloriq". Note your region (pick closest to Tallinn → EU West).
2. Once created, go to **SQL Editor → New query**.
3. Paste the contents of `supabase-setup.sql` and click **Run**.
4. Go to **Project Settings → API**. Note:
   - `Project URL` → this is your `SUPABASE_URL`
   - `service_role` key (under "Project API keys", click reveal) → this is your `SUPABASE_SERVICE_KEY`
   - ⚠️ Never expose the service_role key in frontend code — only in Vercel env vars.

---

## Step 2 — GitHub: push the code

```bash
cd caloriq
git init
git add .
git commit -m "initial"
# Create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/caloriq.git
git push -u origin main
```

---

## Step 3 — Vercel: deploy

1. Go to vercel.com → Add New Project → Import your GitHub repo.
2. Leave all build settings as default (Vercel auto-detects).
3. Before deploying, click **Environment Variables** and add:

| Name | Value |
|------|-------|
| `ANTHROPIC_API_KEY` | your Anthropic key |
| `SUPABASE_URL` | your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | your Supabase service_role key |

4. Click **Deploy**. Done.

---

## Step 4 — Test

Open your Vercel URL on your phone. Try:

1. Type "2 scrambled eggs and a slice of toast" → hit send.
2. Check Supabase → Table Editor → food_log for the row.
3. Type "75.5kg" → hit send → switch to Weight tab.
4. Tap an entry to edit it.

---

## Files overview

```
caloriq/
├── api/
│   ├── log.js       # GET entries + POST new log (Claude → Supabase)
│   └── entry.js     # PUT update + DELETE entry
├── public/
│   └── index.html   # Entire frontend (one file)
├── vercel.json      # Routing config
├── package.json     # Dependencies
└── supabase-setup.sql
```
