# luna-ai-lab-website

Source for [luna-ai-lab.com](https://luna-ai-lab.com/) — the Luna AI Lab studio page and CV.

Plain static HTML, CSS and JS. There is no build step and no dependencies.

## Layout

| Path | Serves |
| --- | --- |
| `index.html` | Studio page (`/`) |
| `viktor/index.html` | Full CV (`/viktor/`) |
| `styles.css` | Shared design system for every page |
| `main.js` | Hero ensemble canvas, scroll reveal, footer year |
| `404.html` | Custom not-found page |
| `assets/` | Favicon and social preview image |
| `CNAME` | Custom domain — **do not delete or rename** |

## Local preview

```bash
python3 -m http.server 8000
# http://localhost:8000/
```

## Deploy

GitHub Pages serves the root of `main` directly (legacy build, source `main` / `/`).
Pushing to `main` publishes; the site is live within about a minute.

```bash
git push origin main
```

Two things must stay true in the repo root or the site breaks: `index.html` must exist,
and `CNAME` must contain `luna-ai-lab.com`.

To roll back: `git revert HEAD && git push`.
