#!/usr/bin/env node
// Pings IndexNow (Bing, Yandex, Seznam, Naver — and the search behind Copilot, ChatGPT search and DuckDuckGo)
// with every URL in the live sitemap, so new or changed pages are recrawled within minutes instead of weeks.
//
//   npm run indexnow                 # after a deploy that adds or changes pages
//   npm run indexnow -- /guides/x    # only these paths
//
// The key is public by design: IndexNow verifies ownership by fetching https://<host>/<key>.txt (public/<key>.txt).

const KEY = '23e4d162b2174b15b103d0da56e9edaa';
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://bugmark.site').replace(/\/$/, '');
const host = new URL(SITE).host;

const paths = process.argv.slice(2);
let urls;
if (paths.length) {
  urls = paths.map((p) => SITE + (p.startsWith('/') ? p : '/' + p));
} else {
  const xml = await (await fetch(SITE + '/sitemap.xml')).text();
  urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]).filter((u) => !/\.(webp|png|jpe?g)$/.test(u));
}

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList: urls }),
});
console.log(`IndexNow: ${res.status} ${res.statusText} — submitted ${urls.length} URLs`);
if (res.status >= 400) {
  console.log(await res.text());
  process.exit(1);
}
