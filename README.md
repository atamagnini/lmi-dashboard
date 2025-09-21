# LMI Dashboard (WordPress + React)

**Shortcode plugin** that mounts a **React (Vite)** app and visualizes job postings from a CSV.

- **Charts:**
  - **Top 10 Companies by Job Postings** (bar chart)
  - **Top 10 States by Job Postings** (treemap)
- **Tech Stack:** WordPress shortcode, React 18, Vite, Recharts, D3 (CSV parsing)

**Live link for reviewers:** https://sprayletter.s6-tastewp.com/julius-react-wp-test/

---

## Quick Start (Local)

1. **Copy this folder to your WP install:**  
   ```
   wp-content/plugins/lmi-dashboard/
   ```

2. **Ensure dataset exists:**  
   ```
   wp-content/plugins/lmi-dashboard/assets/Sample_Dataset.csv
   ```

3. **(Only if you need to rebuild the frontend)**
   ```bash
   cd wp-content/plugins/lmi-dashboard/app
   npm install
   npm run build
   ```
   This generates `build/` with `.vite/manifest.json`.

4. **WP Admin → Plugins → activate "LMI Dashboard".**

5. **Create/edit a page and add the shortcode:**
   ```
   [lmi_dashboard]
   ```
   
---

## Repo Structure (small plugin repo)

```
lmi-dashboard/
├── lmi-dashboard.php
├── assets/
│   └── Sample_Dataset.csv
├── app/                         
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── (optional) package-lock.json
├── build/                     
│   ├── .vite/manifest.json
│   └── ... hashed assets ...
├── README.md
└── .gitignore
```

**Important:** Do not ignore `build/` — include it so the plugin works without a build step.

---

## Planning Notes (How It Works)

- **WP integration:** A shortcode `[lmi_dashboard]` prints a mount `<div>` and enqueues the Vite-built ESM bundle.
- **Manifest resolver:** PHP reads Vite 5's `build/.vite/manifest.json` to enqueue hashed JS/CSS with `type="module"`.
- **Data wiring:** CSV is bundled in `assets/`. The PHP injects the CSV URL via:
  - `window.LMI_DASHBOARD.dataUrl` (inline config), and
  - `data-csv-url` on the mount `<div>` as a fallback.
  - The React app loads it with `d3.csv(...)`.
- **Transforms:**
  - **Top 10 Companies:** `SUM(job_posting_count) BY grouped_company`, sort desc, top 10.
  - **Top 10 States (Treemap):** `SUM(job_posting_count) BY state`, sort desc, top 10 → map to `{ name, size }`.

---

## Architecture Diagram

```mermaid
flowchart LR
  A[WP Page] --> B[Shortcode: lmi_dashboard]
  B --> C[Mount React App]
  C --> D[Fetch CSV (/assets/Sample_Dataset.csv)]
  D --> E[Parse (d3.csv)]
  E --> F[Render Charts]
```

---

## Deploy / Public Link

- **Hosting:** TasteWP sandbox.
- **Public URL:** https://sprayletter.s6-tastewp.com/julius-react-wp-test/
- **Availability window:** Up to **7 days** from creation - created on **September 21, 2025**, so it should remain live until **September 28, 2025** (unless manually deleted). If it expires, I will recreate the sandbox and update this link.
- **Notes:** The plugin ZIP includes the prebuilt `build/`, so no build step is required. The page uses the `[lmi_dashboard]` shortcode.

---

## Troubleshooting

### Stuck at "Loading LMI Dashboard…"
Ensure `build/.vite/manifest.json` exists and the page source contains:
```html
<script type="module" src=".../build/...js">
```

### "Missing dataUrl" / blank charts
Open the CSV directly in the browser to confirm 200:
```
https://your-site/wp-content/plugins/lmi-dashboard/assets/Sample_Dataset.csv
```
The mount `<div id="lmi-dashboard-root">` also carries `data-csv-url` as a fallback.

---

## What I’d Build Next

- **Interactive filters:** State / Company filters, quick search, and an exportable table (CSV download).
- **Accessibility & responsiveness:** ARIA roles, keyboard navigation, and a screen-reader table fallback.
- **Gutenberg block:** block wrapper with attributes (title, data URL) to insert/configure from the editor.
- **CI pipeline:** GitHub Actions to build the frontend and attach a ready-to-install plugin ZIP on releases.
