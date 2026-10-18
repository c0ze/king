# King

King, the Turkish trick-taking card game, as a static web app for **king.arda.tr**.
You play 20 hands against three computer players. The UI is in English, Turkish and
Japanese, works on phones, and installs as a PWA that plays offline.

## Layout

| Path | What it is |
|---|---|
| `src/game.html` | The whole game: rules engine, bots, translations, UI. It is a page body, so it can also be published as a Claude artifact unchanged. |
| `public/` | Files copied into the site as they are: manifest, service worker, icons, `og.png`, `CNAME`, `robots.txt`. |
| `tools/build.mjs` | Wraps `src/game.html` in a full HTML document (meta tags, manifest, service worker registration) and writes `dist/`. |
| `tools/selftest.mjs` | Plays 300 full bot games and checks every card is legal, every game sums to zero and every quota is met. Also checks that all three languages have every string. |
| `tools/icons.sh` | Renders the PNG icons and `og.png` from the SVG sources (needs `rsvg-convert`). |

```sh
npm test          # engine and translation checks
npm run build     # writes dist/
npm run serve     # build, then serve dist/ on http://localhost:8417
```

There are no dependencies to install. Node 18 or newer is enough.

## Deploying to king.arda.tr

`dist/` is a plain static site. Every file can be cached, except `index.html` and `sw.js`.
Serve those two with `Cache-Control: no-cache` so a new deploy reaches players on
their next visit.

### Option A: GitHub Pages (workflow included)

1. Push this folder to a GitHub repository with `main` as the default branch.
2. In the repository settings, go to **Pages** and set **Source** to **GitHub Actions**.
   `.github/workflows/pages.yml` tests, builds and deploys on every push to `main`.
3. At your DNS provider for `arda.tr`, add a record:
   `king  CNAME  <github-user>.github.io.`
4. Back in Pages settings, enter `king.arda.tr` as the custom domain and enable
   **Enforce HTTPS** once the certificate is issued. `public/CNAME` already holds the domain.

The workflow runs on `ubuntu-latest`, not on the self-hosted runner.

### Option B: Cloudflare Pages, Netlify or any static host

Build command `node tools/build.mjs`, output directory `dist`. Then point
`king.arda.tr` at the host the way it tells you to.

### Option C: your own server

```sh
npm run build
rsync -av --delete dist/ user@server:/var/www/king.arda.tr/
```

nginx:

```nginx
server {
    server_name king.arda.tr;
    root /var/www/king.arda.tr;
    location = /index.html { add_header Cache-Control "no-cache"; }
    location = /sw.js      { add_header Cache-Control "no-cache"; }
    location /             { try_files $uri $uri/ /index.html; }
    # listen 443 ssl; plus certificates, e.g. from certbot --nginx -d king.arda.tr
}
```

HTTPS is required for installing the app and for offline play, since the service worker
only registers on `https:`.

## Notes

- Fonts come from Google Fonts and are cached by the service worker after the first visit.
- Saved games, language, speed and sound live in the player's `localStorage`.
- The house rules are described on the in-game Rules screen. Change them in the
  engine section of `src/game.html`, between `/*ENGINE-START*/` and `/*ENGINE-END*/`,
  then run `npm test`.
