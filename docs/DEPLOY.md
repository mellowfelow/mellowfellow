# Mellow Fellow — deploy & post-deploy checklist

> Internal. Not served (`/docs/*` → 404).

This folder **is** the website — a static multi-page site. No build step for the HTML.

## Deploy (Cloudflare Pages)
1. Push the repo (or upload the folder contents) to the Pages project. Output dir = repo root. No build command.
2. First deploy after any CSS/JS change → Cloudflare dashboard → Caching → Configuration → **Purge Everything** once. Assets are `?v=` stamped, so later deploys are instant.
3. Confirm `mellowfellowcarts.com` is attached and `www` redirects to apex.

## Regenerate derived files before deploy (when pages were added/removed/renamed)
```
node scripts/gen-sitemaps.mjs      # rebuilds sitemap.xml + the 4 child sitemaps, lastmod = today
```
`docs/` and `search/` are auto-excluded; noindex pages are auto-excluded.

## Post-deploy — indexing
1. **IndexNow** (Bing / Yandex / Seznam) — ping after every deploy:
   ```
   node scripts/indexnow.mjs                 # submit all sitemap URLs
   node scripts/indexnow.mjs /product/foo/   # or just the pages that changed
   ```
   Key file: `29b8871d9bc61c7b8ec7a7fbcd7173e2.txt` at root (already live).
2. **Google Search Console** → Sitemaps → resubmit `https://mellowfellowcarts.com/sitemap.xml`. Then URL Inspection → Request Indexing on the homepage + top category pages.
3. **Bing Webmaster Tools** → Sitemaps → submit the sitemap index **and each child individually**
   (`sitemap-pages.xml`, `sitemap-categories.xml`, `sitemap-products.xml`, `sitemap-blog.xml`) —
   Bing has been slow to expand the index on its own (was discovering only ~10 URLs).
   Also verify the IndexNow key under Bing WMT → IndexNow.

## Order emails
Checkout submits to `info@mellowfellowcarts.com` via Web3Forms (key in `src`… actually `js/site-v13.js`, public by design) and fires a best-effort n8n ops webhook. The first Web3Forms email in a fresh inbox may need a one-time confirmation click.

## What's in this build (2026-09 audit fixes applied)
- 254 product pages, 40 category pages, 35 blog posts, legal/utility pages, `/search/`, `404.html`
- Trailing-slash canonical everywhere (internal links + schema + agent files)
- Client-side filter/sort on shop + category pages; real `/search/` results page
- Full agent-ready file set (`llms.txt`, `auth.md`, `.well-known/*`, `webmcp.js`)
