# Static site scaffold — GOD

Try to become best

Preview locally

Using any static server (recommended):

PowerShell (Python installed):

```powershell
# from the workspace root
python -m http.server 8000 -d site
# then open http://localhost:8000/index.html
```

Using Node (if installed):

```powershell
npx http-server site -p 8000
```

Deploy

- GitHub Pages: push the `site/` folder to the `gh-pages` branch or set GitHub Pages source to `/root` for a dedicated repo.
- Any static host (Netlify, Vercel, Surge) will work.

Customization

- Edit `site/css/style.css` for colors and layout.
- Replace logo text in HTML files.
