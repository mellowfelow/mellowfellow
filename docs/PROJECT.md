# Mellow Fellow — PROJECT.md

> Internal record. NEVER served publicly — `/docs/*` returns 404 at the edge (`_redirects`) and is `Disallow`ed in robots.txt.

## Identity
- **Domain:** mellowfellowcarts.com (live, Cloudflare Pages)
- **Site name:** Mellow Fellow
- **Tagline:** Science-first cannabinoid blending for every mood
- **Primary color / brand:** sage green + cream (see `css/style-v12.css` tokens)
- **GSC verification:** `cFJp6-35d2SXIPaeiZzR5ad5gkvJnotY4AfEniT2Y3M` (URL-prefix property `https://mellowfellowcarts.com/`, account: Fifty Bar Vape / fiftybarvapeshop@gmail.com)
- **Bing verification:** `1E4E659BFCC8CE6853AFC74B2AD6D954`
- **IndexNow key:** `29b8871d9bc61c7b8ec7a7fbcd7173e2` (file at root: `29b8871d9bc61c7b8ec7a7fbcd7173e2.txt`)

## Architecture
- **Static multi-page site.** No framework, no build step — pre-rendered `folder/index.html` per route. 342 HTML files (254 products, 40 categories, 35 blog posts, legal/utility).
- **Deploy target:** Cloudflare Pages (this folder = deploy root). `_headers` + `_redirects` at root.
- **Backend:** No.
- **Canonical URL form: trailing slash** (`/shop/disposables/`). Every internal link, every schema `url`, `_redirects`, `llms.txt` and agent-file URL must use the trailing slash. Cloudflare 308-redirects the non-slash form.
- **JS:** `js/site-v13.js` (age gate, drawer, cart, checkout, search, forms), `js/products-lookup.js` (`window.MF_PRODUCTS` id→{name,price}, `window.MF_SEARCH` search index), `js/webmcp.js` (WebMCP tools).
- **CSS:** `css/style-v12.css` + `css/site-v13.css` + `css/fonts.css` (self-hosted woff2).

## Contact & business
- **Email:** info@mellowfellowcarts.com
- **WhatsApp:** +1 216 250 5746 (`https://wa.me/12162505746`)
- **Live chat widget:** Tawk.to (`6a5e3e1e1c52dc1d4c7ee82b/1ju025dff`)
- **Region / HQ signal:** South Florida, USA (geo.region US-FL)
- **Currency:** USD (also quotes BTC/USDT)

## Order rules
- Minimum order: **$100**
- Free shipping: orders over **$200** (flat $20 below that)
- First-order discount: **10%** with code **MeFe**, applied automatically to all crypto payments at checkout
- **Payment methods (canonical — keep every surface in sync):** Bitcoin (BTC), USDT (Tether ERC-20), Apple Pay, Chime, CashApp. BTC/USDT show wallet + QR at checkout; Apple Pay / Chime / CashApp are confirmed by emailed instructions after the order.
  - BTC wallet: `bc1q95huj62jcxq4pvsa09herj0ssh4aeanc3v8jn2`
  - USDT (ERC-20): `0x3819109CAdeE74becf86F5Ddff8e8A57681ACd04`
- Ships: USA nationwide (USPS Priority from South Florida), 2–5 business days
- Age gate: 21+

## Forms
- Provider: **Web3Forms**, access key `1f43d851-ec13-4aca-8d41-1e4f8fd9ed9b` (public by design).
- Checkout order form emails info@mellowfellowcarts.com and also fires an n8n ops webhook (`my-n8n-server-d8fz.onrender.com/webhook/order-intake`, best-effort, non-blocking).
- Contact + wholesale forms use the same key (handlers in `site-v13.js` `bindForms()`).
- Thank-you: `/order-confirmed/` for checkout. (Contact/wholesale currently toast in place — see audit follow-ups.)

## Brand authority facts (VERIFIED — never add to this list without the client confirming)
- Founded **2019**, South Florida, by a PhD chemist + a licensed pharmacist + cannabis-industry entrepreneurs
- 2019–2021: two years of formulation science before first product launch
- 2022: launched **M-Fusions** line; expanded into rare cannabinoids (THCp, THCh, THCa)
- Flagship: **Destination Series** — 18 mood-specific blends (Euphoria, Dream, Creativity, Introvert, Tranquility, Desire, Charged, Recover, Motivation, Wanderlust, Clarity, Laughter, Grounded, Connection, Adventure, Harmony, Limitless, Passion)
- Partners: **Arvida Labs** (formulation science), **Florida Healthy Alternatives Association** (compliance), **Good Fellows Coalition** (community advocacy)
- All products Farm Bill compliant, hemp-derived, third-party lab tested by ISO-accredited labs; COA on request
- Catalogue: ~254 SKUs across 7 categories
- **No invented statistics, awards, press, named clients, revenue, or employee counts.**
- **`sameAs` / social profiles:** NOT YET SUPPLIED by client — omitted from schema until confirmed real + brand-owned.

## Compliance language
- Hemp-derived, Farm Bill compliant, adults 21+ only, "not evaluated by the FDA", third-party lab tested.
- No medical claims / cure claims. No sales to minors.

## Deploy
1. This folder is the site. Push repo (or upload folder contents) to Cloudflare Pages.
2. First deploy after a CSS/JS change: purge Cloudflare cache once (assets are `?v=` stamped thereafter).
3. Re-submit `sitemap.xml` + child sitemaps to GSC and Bing; ping IndexNow for changed URLs.

## SEO state (as of 2026-09-10 audit — see `audit-2026-09-10.md`)
- GSC: ~2,150 clicks / 50K impr / 90 days · 330 indexed / 331 not-indexed (311 = "page with redirect" from non-slash internal links — being fixed)
- Bing: ~525 clicks / 7.6K impr · sitemap discovery incomplete (10/327) · IndexNow not active
- Semrush: Authority Score 7 · 529 organic keywords (−9.6%) · toxic backlink profile (73% ref domains AS 0–10, SG/TR/MD geo) — disavow needed
- Traffic ~90% branded, ~90% from `/blog/mellow-fellow-destination-series-guide/`. Homepage + commercial pages rank position 20+.
- Direct competitor capturing brand terms: `themellowfellow.shop` (≈3× organic traffic).
