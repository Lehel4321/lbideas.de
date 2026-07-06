# Cutting Machine Simulator — how it works

The **CableCutter PRO** simulation from your private
[`CuttingMaschine`](https://github.com/Lehel4321/CuttingMaschine) repo is
published on the site as a static build inside **`/cutting-machine/`** and
shown on the home page in the **Simulator** section, behind an access code.

Live URL: <https://lbideas.de/#simulator> (or direct: <https://lbideas.de/cutting-machine/>)

---

## 1. The access code

Open `index.html` and find this line near the bottom (in the `<script>`):

```js
const SIM_ACCESS_CODE = "CUT-4321";
```

Change `"CUT-4321"` to whatever code you want, then save, commit and push.

**Honest note on security:** this is a *client-side* gate. It keeps normal
visitors out, but the site is a public, static GitHub Pages site, so a
technical person could read the code from the page source or open
`/cutting-machine/` directly. It's fine for a portfolio piece. If you ever
need real, un-bypassable protection, the app has to move behind a login on a
host like Netlify or Cloudflare Access — ask Claude and we can set that up.

---

## 2. Upgrading the simulator when you improve the project

You have three ways, from easiest to most automatic:

### Option A — one click on GitHub (recommended)
1. Do the **one-time setup** below.
2. Whenever you've updated `CuttingMaschine`, go to this repo's
   **Actions** tab → **Update Cutting Machine Simulator** → **Run workflow**.
3. It rebuilds from the latest `CuttingMaschine` and updates the site.

### Option B — fully automatic (push → site updates itself)
Do the one-time setup, then add this workflow to the **CuttingMaschine** repo
as `.github/workflows/notify-site.yml`. Every push there triggers the rebuild
here:

```yaml
name: Notify site
on:
  push:
    branches: [main]
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger site rebuild
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SITE_TOKEN }}" \
            -H "Accept: application/vnd.github+json" \
            https://api.github.com/repos/Lehel4321/lbideas.de/dispatches \
            -d '{"event_type":"cutting-machine-updated"}'
```
(Needs a `SITE_TOKEN` secret in CuttingMaschine — a token that can trigger
this repo, Contents/Actions write.)

### Option C — just ask Claude
Say "update the cutting machine on my site" and it rebuilds and pushes for you.
Nothing to set up.

---

## One-time setup (needed for Options A and B)

`CuttingMaschine` is **private**, so the workflow needs permission to read it:

1. GitHub → **Settings → Developer settings → Fine-grained tokens →
   Generate new token**.
   - Repository access: only **CuttingMaschine**
   - Permissions: **Contents → Read-only**
2. In **this** repo (`lbideas.de`): **Settings → Secrets and variables →
   Actions → New repository secret**.
   - Name: `CM_TOKEN`
   - Value: the token you just created.

That's it. The workflow file lives at
`.github/workflows/update-cutting-machine.yml`.

---

## How the build is made

The app is a Vite + React project with no backend and no API keys, so it
compiles to plain static files:

```bash
# inside a clone of CuttingMaschine
npm install
npx vite build --base=/cutting-machine/   # base path matters for the subfolder
# then copy dist/* into lbideas.de/cutting-machine/
```

The `--base=/cutting-machine/` flag is important: it makes the app load its
JS/CSS from `/cutting-machine/assets/...` instead of the site root.
