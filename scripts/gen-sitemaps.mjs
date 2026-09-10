/* Regenerate all sitemaps from the built filesystem.
   Run from repo root:  node scripts/gen-sitemaps.mjs
   - Excludes any page carrying <meta name="robots" content="noindex">
   - Excludes /docs/, /search/, /404, utility pages
   - Product entries carry <image:image> from og:image
   - lastmod = today (single consistent date across index + children) */
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.argv[2] || '.');
const HOST = 'https://mellowfellowcarts.com';
const TODAY = new Date().toISOString().slice(0, 10);

const SKIP_DIRS = new Set(['docs', 'search', 'images', 'css', 'js', 'assets', '.git', '.claude', 'scripts', '.well-known', 'node_modules']);

function pages() {
  const out = [];
  (function walk(dir, rel) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) {
        if (SKIP_DIRS.has(e.name)) continue;
        walk(path.join(dir, e.name), rel + '/' + e.name);
      } else if (e.name === 'index.html') {
        out.push({ file: path.join(dir, e.name), url: (rel === '' ? '/' : rel + '/') });
      }
    }
  })(ROOT, '');
  return out;
}

const UTILITY = new Set(['/404/', '/cart/', '/checkout/', '/order-confirmed/', '/search/',
  '/thank-you-contact/', '/thank-you-wholesale/']);

const groups = { pages: [], categories: [], products: [], blog: [] };

for (const p of pages()) {
  if (UTILITY.has(p.url)) continue;
  const html = fs.readFileSync(p.file, 'utf8');
  if (/<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(html)) continue;

  let bucket = 'pages', priority = '0.6', changefreq = 'monthly', image = null;
  if (p.url.startsWith('/product/')) {
    bucket = 'products'; priority = '0.6';
    const og = html.match(/<meta property=["']og:image["'] content=["']([^"']+)["']/);
    if (og) image = og[1];
  } else if (p.url.startsWith('/shop')) {
    bucket = 'categories'; priority = p.url === '/shop/' ? '0.9' : '0.8'; changefreq = 'weekly';
  } else if (p.url.startsWith('/blog/') && p.url !== '/blog/') {
    bucket = 'blog'; priority = '0.7';
  } else if (p.url === '/') {
    priority = '1.0'; changefreq = 'weekly';
  } else if (['/about/', '/blog/', '/faq/', '/wholesale/', '/contact/'].includes(p.url)) {
    priority = '0.8'; changefreq = 'weekly';
  }
  groups[bucket].push({ url: p.url, priority, changefreq, image });
}

function xmlEsc(s) { return s.replace(/&/g, '&amp;'); }

function writeChild(name, items, withImage) {
  const ns = withImage
    ? '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'
    : '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  const body = items.sort((a, b) => a.url.localeCompare(b.url)).map(it => {
    let s = '  <url>\n' +
      `    <loc>${HOST}${it.url}</loc>\n` +
      `    <lastmod>${TODAY}</lastmod>\n` +
      `    <changefreq>${it.changefreq}</changefreq>\n` +
      `    <priority>${it.priority}</priority>\n`;
    if (withImage && it.image) {
      s += `    <image:image>\n      <image:loc>${xmlEsc(it.image)}</image:loc>\n    </image:image>\n`;
    }
    return s + '  </url>';
  }).join('\n');
  fs.writeFileSync(path.join(ROOT, name), `<?xml version="1.0" encoding="UTF-8"?>\n${ns}\n${body}\n</urlset>\n`);
  return items.length;
}

const counts = {
  pages: writeChild('sitemap-pages.xml', groups.pages, false),
  categories: writeChild('sitemap-categories.xml', groups.categories, false),
  products: writeChild('sitemap-products.xml', groups.products, true),
  blog: writeChild('sitemap-blog.xml', groups.blog, false),
};

const idx = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${HOST}/sitemap-pages.xml</loc><lastmod>${TODAY}</lastmod></sitemap>
  <sitemap><loc>${HOST}/sitemap-categories.xml</loc><lastmod>${TODAY}</lastmod></sitemap>
  <sitemap><loc>${HOST}/sitemap-products.xml</loc><lastmod>${TODAY}</lastmod></sitemap>
  <sitemap><loc>${HOST}/sitemap-blog.xml</loc><lastmod>${TODAY}</lastmod></sitemap>
</sitemapindex>
`;
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), idx);

console.log('sitemaps regenerated @', TODAY);
console.log(counts, 'total', Object.values(counts).reduce((a, b) => a + b, 0));
