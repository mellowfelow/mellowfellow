MELLOW FELLOW — CLOUDFLARE PAGES DEPLOYMENT
============================================

This folder IS the website. Deploy its contents to Cloudflare Pages.

HOW TO DEPLOY
-------------
1. In Cloudflare Pages, create/select your project.
2. Upload the CONTENTS of this folder as the site root
   (drag-and-drop the files in the Pages dashboard, or connect
   your repo). No build command needed — output dir is this folder.
3. Confirm the domain mellowfellowcarts.com is attached.
   GSC + Bing verification meta tags are already on every page.

FIRST DEPLOY ONLY — clear the old cache once
--------------------------------------------
The previous version cached CSS/JS for a year. To flush it:
Cloudflare dashboard -> Caching -> Configuration -> Purge Everything.
After this one purge, future deploys appear instantly (asset URLs
are version-stamped with ?v=, so caching never blocks updates again).

AFTER DEPLOY — re-trigger indexing
----------------------------------
Google Search Console: Sitemaps -> resubmit
  https://mellowfellowcarts.com/sitemap.xml
  Then URL Inspection -> Request Indexing on a few pages.
Bing Webmaster Tools: Sitemaps -> resubmit the same URL.

ORDER EMAILS
------------
Checkout orders email to info@mellowfellowcarts.com via web3forms.
The first order may need a one-time confirmation click in that inbox.

WHAT'S IN THIS BUILD
--------------------
- 322 real, individually indexable pages (254 product pages,
  categories, blog, etc.) — fixes the GSC/Bing duplicate-canonical
  and "crawled, not indexed" problem.
- Fixed mobile navigation + collapsible shop sidebar.
- Logo + search icon in the nav bar.
- Quantity steppers on every product card.
- Full checkout form: customer info, payment method, automatic
  10% crypto discount, order-number generation, thank-you page,
  and order email to your inbox.
- SEO optimized with your keyword research (titles, meta, FAQ,
  schema) and duplicate-product canonical consolidation.
