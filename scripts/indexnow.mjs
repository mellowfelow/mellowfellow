/* Ping IndexNow (Bing, Yandex, Seznam, …) with changed URLs.
   Run AFTER every deploy:
     node scripts/indexnow.mjs                → submits every URL in the sitemaps
     node scripts/indexnow.mjs /path/ /p2/    → submits only the given paths
   Docs: https://www.indexnow.org/documentation */
import fs from 'fs';

const HOST = 'mellowfellowcarts.com';
const KEY = '29b8871d9bc61c7b8ec7a7fbcd7173e2';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;

let urls = process.argv.slice(2).map(p => `https://${HOST}${p.startsWith('/') ? p : '/' + p}`);

if (!urls.length) {
  for (const f of ['sitemap-pages.xml', 'sitemap-categories.xml', 'sitemap-products.xml', 'sitemap-blog.xml']) {
    if (!fs.existsSync(f)) continue;
    for (const m of fs.readFileSync(f, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)) urls.push(m[1]);
  }
}
urls = [...new Set(urls)];
if (!urls.length) { console.error('no URLs to submit'); process.exit(1); }

const body = { host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList: urls };

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(body),
});

console.log(`IndexNow: submitted ${urls.length} URLs → HTTP ${res.status} ${res.statusText}`);
console.log(await res.text() || '(empty body — 200/202 means accepted)');
if (res.status >= 400) process.exit(1);
