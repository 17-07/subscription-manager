# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Samudrop** is a static, no-build toolset for dropshipping management. It consists of plain HTML/CSS/JS files opened directly in a browser — there is no bundler, framework, package.json, or build step. Deployment is via Vercel (static hosting).

## Architecture

### Entry point
`index.html` — the main hub. Renders a card grid linking to each tool. Some tools open as modal popups (iframe or inline HTML injected via `srcdoc`); others are separate pages.

### Tools and their files

| Tool | Type | File |
|---|---|---|
| Gestor de Suscripciones | Separate page | `subscriptions.html` + `app.js` |
| Generador de Reviews | Modal → external iframe | claude.site embed URL in `index.html` |
| Generador de Políticas | Modal → external iframe | claude.site embed URL in `index.html` |
| Configuración de Dominio | Modal → inline HTML steps | `index.html` |
| Test Order Email | Modal → inline copyable text | `index.html` |
| Redirección de Tráfico | Modal → inline HTML steps | `index.html` |
| Generador de Comentario TikTok | Modal → `srcdoc` injected | `TIKTOK_COMMENT_HTML` string in `index.html` |
| Descargador de Vídeos | Modal → `srcdoc` injected | `DOWNLOADER_HTML` string in `index.html` |
| Herramientas de IA | Separate page | `ia.html` |
| Descargador de Vídeos (standalone) | Separate page | `videoDownloader.html` |

### `srcdoc` pattern
The TikTok comment generator and video downloader are embedded as full HTML documents stored as JS template literals (`TIKTOK_COMMENT_HTML`, `DOWNLOADER_HTML`) inside `index.html`. These are injected into `<iframe srcdoc="...">` on first modal open (lazy). This avoids Vercel connection issues with external iframes.

### Subscription manager (`subscriptions.html` + `app.js`)
- Protected by a 4-digit PIN (`const PIN = '2038'` in `app.js`), checked client-side with `sessionStorage`
- Persisted to **Supabase** (`subscriptions` table). Credentials (anon key) are hardcoded in `app.js`
- All UI is generated via `innerHTML` strings inside `render()` — no templating library
- Three subscription categories: `tiendas` (Shopify stores), `apps` (Shopify apps, linked to a tienda), `herramientas` (external tools)
- Color-coded urgency: red < 7 days, amber < 15 days, green otherwise

### Video downloader API
The downloader tool calls a backend deployed on Render: `https://video-downloader-api-fjac.onrender.com/download` (POST with `{ url }`). It receives a video blob directly and creates an object URL for download.

## Development

Open any `.html` file directly in a browser. There is no local server required, though one can be used:

```bash
python3 -m http.server 8080
# or
npx serve .
```

No linting, testing, or build commands exist in this project.

## Key conventions

- All CSS is inline (`<style>` tags in each file) — no shared stylesheet
- Dark theme throughout: base background `#020617` or `#0a0a0c`, card background `#0f172a`
- Gradient brand colors: purple `#a78bfa` → pink `#f472b6`
- All UI text is in Spanish (`lang="es"`)
- Modals in `index.html` are toggled with `.open` class via `openModal(id)` / `closeModal(id)`; Escape key closes all open modals
