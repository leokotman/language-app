# Supabase setup (your steps)

Do this once to connect the app to Supabase. The app already has the client code; it just needs your project URL and key.

---

## 1. Create a Supabase project

1. Go to **[https://supabase.com](https://supabase.com)** and sign in (or create an account).
2. Click **“New project”**.
3. **Organization:** use the default or create one.
4. **Name:** e.g. `language-app`.
5. **Database password:** choose a strong password and **save it** (you’ll need it for DB access later).
6. **Region:** pick one close to you.
7. Click **“Create new project”** and wait until it’s ready (1–2 minutes).

---

## 2. Get the URL and anon key

1. In the Supabase dashboard, open your project.
2. In the left sidebar, click **“Project Settings”** (gear icon).
3. Open the **“API”** section.
4. You’ll see:
   - **Project URL** (e.g. `https://xxxxx.supabase.co`)
   - **Project API keys** → **anon public** (long string starting with `eyJ...`)

Keep this tab open; you’ll paste these into `.env` next.

---

## 3. Add env vars in this repo

1. In the project root, copy the example env file:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and set:
   - `VITE_SUPABASE_URL` = your **Project URL** (from step 2).
   - `VITE_SUPABASE_ANON_KEY` = your **anon public** key (from step 2).

Example:

```env
VITE_SUPABASE_URL=https://abcdefgh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. Save the file. **Do not commit `.env`** (it’s in `.gitignore`).

---

## 4. Enable Auth providers (for Week 2 – Authentication)

When we add login/signup, you’ll need to turn on the providers in Supabase:

1. In the dashboard, go to **Authentication** → **Providers**.
2. **Email:** already on; optional: turn on “Confirm email” if you want verification.
3. **Google (OAuth):** when we add it, you’ll add a Google OAuth client ID/secret here. We’ll do that in the auth step.

You can leave Google for later and only use email for now.

---

## 5. Check that the app can talk to Supabase

1. Restart the dev server so it picks up `.env`:
   ```bash
   npm run dev
   ```
2. Open the app in the browser. There should be **no** console warning about missing `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` if `.env` is set correctly.

Once this is done, we can add authentication (sign up, login, protected routes).
