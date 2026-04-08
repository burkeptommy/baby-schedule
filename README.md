# Valerie · a tiny rhythm

A phone-sized web app for tracking the daily rhythm of a little baby: sleeps, feeds, naps, bath, bedtime. Plus a live age counter and the current Wonder Weeks *leap* with checkable milestones.

Built as a single static page (vanilla HTML / CSS / JS, no build step). Deployed to GitHub Pages.

## What it does

- **Right now** — big, calm display of the current phase (wake / nap / bath / sleep) with a soft progress bar to the next transition.
- **Up next** — the very next event with a countdown.
- **The whole day** — every event in a timeline. Past events fade out, the current one glows.
- **Age** — live weeks + months + days since birth.
- **Leaps** — the current Wonder Weeks "leap" is auto-selected from age, with a short description and a checkable milestone list. Tap arrows to browse other leaps. Checking a milestone shoots a little confetti.
- **Edit** — tap the gear. Add, edit, delete rows. Tap-and-hold any event in the main list to jump straight to its editor row.
- **Backup** — export your schedule as JSON, import it on another phone.
- **Dark mode** — follows your phone's setting.
- **Installable** — "Add to Home Screen" makes it feel like a real app.

Everything is stored in `localStorage` on the device. Nothing goes to a server.

## First-time setup — enabling GitHub Pages

Pages is enabled automatically by the workflow the first time it runs. The `actions/configure-pages` step uses `enablement: true`, which flips the repo's Pages source to "GitHub Actions" for you and creates the `github-pages` environment. No manual toggle in repo settings is needed.

Any push to `main` or a `claude/**` branch will build and deploy automatically via `.github/workflows/pages.yml`.

Once deployed, the site lives at:

> **https://burkeptommy.github.io/baby-schedule/**

Open that URL on your phone, then use Safari's *Share → Add to Home Screen* (iOS) or Chrome's *Install app* (Android) to get an icon on your home screen.

Note: only one deployment is "live" at a time — pushing to `main` will overwrite a feature-branch preview and vice versa. For solo use that's fine.

## File layout

```
index.html                     markup + PWA meta tags
app.css                        pink/purple theme (light + dark)
app.js                         rendering, editing, persistence, leaps, confetti
manifest.webmanifest           PWA install manifest
icon.svg                       app icon
.github/workflows/pages.yml    GitHub Actions Pages deploy
```

No dependencies. No build step. Open `index.html` in a browser and it works.

## Local development

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Any static file server will do — the app reads nothing off the network except the Google Font `Fraunces`.

## A note on Wonder Weeks milestones

The leap weeks (5, 8, 12, 19, 26, 37, 46, 55, 64, 75) come from the widely-known *The Wonder Weeks* developmental framework by Hetty van de Rijt and Frans Plooij. The milestone text in this app is written in plain English as a friendly checklist of observable behaviors — it is not a quote from the book and it is not medical advice. Every baby grows on her own schedule. Use it as a fun companion, not a rubric.

## License

Personal project. Use freely.
