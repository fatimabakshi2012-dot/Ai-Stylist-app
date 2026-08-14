# Swatch — AI Stylist App

A free, working starter for your AI stylist app. Users can share a photo,
a text description, or answer a few quick questions (any combination) —
Gemini reads it and returns personalized color, cut, and style recommendations.

## What's in this folder

```
ai-stylist-app/
├── index.html      → the page users see
├── style.css        → the design
├── script.js         → frontend logic (tabs, upload, calling the API)
├── api/style.js       → server function that talks to Gemini (keeps your API key private)
└── README.md          → this file
```

## Step 1 — Get a free Gemini API key

1. Go to https://aistudio.google.com/apikey
2. Sign in with a Google account
3. Click "Create API key"
4. Copy the key somewhere safe — you'll need it in Step 3

Gemini's free tier is generous enough to run a small public app without paying anything, as long as usage stays moderate.

## Step 2 — Put this project on GitHub

1. Go to https://github.com and create a free account if you don't have one
2. Click "New repository", name it e.g. `ai-stylist-app`, keep it public or private, click "Create repository"
3. Upload all the files in this folder to that repository (GitHub's web uploader works fine — drag and drop the files, keeping the `api` folder structure intact)

## Step 3 — Deploy on Vercel (free)

1. Go to https://vercel.com and sign up (you can sign up with your GitHub account directly)
2. Click "Add New… → Project"
3. Select the `ai-stylist-app` repository you just created
4. Before clicking deploy, open "Environment Variables" and add:
   - Name: `GEMINI_API_KEY`
   - Value: (paste the key from Step 1)
5. Click "Deploy"

After a minute, Vercel gives you a live URL like `ai-stylist-app.vercel.app` —
that's your app, live and public, for free. Anyone can open it on their phone
or computer, no install needed.

## Step 4 — Try it

Open the URL, upload a photo or type a description, hit "Read my style."
The page sends whatever you gave it to `/api/style`, which calls Gemini
server-side (your API key never reaches the browser) and returns the
recommendation, which gets rendered as swatch cards.

## Notes on cost

- Hosting on Vercel: free for personal projects at this scale
- Gemini API: free tier, generous request limits
- No database yet — nothing is saved between visits. That's fine for
  testing the idea; if you later want user accounts or history, Supabase
  (also free tier) is the natural next step, and I'm happy to add it in.

## Ideas for next steps

- Save each user's results (needs a database — Supabase is a good free fit)
- Let users refine their profile over multiple visits instead of one-shot
- Add a "check this specific item" flow — paste a product photo/link and get a yes/no read against their profile
- Turn this into an installable mobile app later via a PWA manifest, once the core idea is validated

## A note on tone

The prompt sent to Gemini (in `api/style.js`) is written to always frame
things positively — what brings out someone's features, never what to
"avoid." If you tweak the prompt, it's worth keeping that principle, since
appearance feedback can land harshly if it isn't handled carefully.
