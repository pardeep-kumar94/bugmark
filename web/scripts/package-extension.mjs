#!/usr/bin/env node
// Packages the Bugmark Chrome extension into public/downloads/ so the website can offer a direct download.
//
//   npm run package:extension                       # extension folder at ../extension (this monorepo)
//   EXTENSION_DIR=/path/to/SiteSignoff npm run package:extension
//
// Optional environment variables (also read from .env.local):
//   NEXT_PUBLIC_SITE_URL        → extension CONFIG website/uninstall URLs + manifest externally_connectable (localhost removed)
//   NEXT_PUBLIC_SUPPORT_EMAIL   → extension CONFIG.supportEmail
//   BUGMARK_GA_MEASUREMENT_ID   → extension anonymous analytics (GA4 property linked to Firebase), e.g. G-XXXXXXX
//   BUGMARK_GA_API_SECRET       → GA4 Measurement Protocol API secret
//
// What it does
//  • copies the extension (skipping "Claude outputs", dotfiles, *.zip, *.pem)
//  • pins the extension ID by adding a public "key" to manifest.json, so every install from the zip gets the same ID
//    (install detection via externally_connectable, and saved data survive re-installs/updates)
//  • fills in the website URL, support email and analytics IDs from the environment
//  • writes public/downloads/bugmark-chrome-extension.zip and lib/release.json (version, size, sha256, extension ID)
import { execFileSync } from 'node:child_process';
import { createHash, generateKeyPairSync, createPublicKey } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const extDir = resolve(process.env.EXTENSION_DIR || join(root, '../extension'));
// Load .env.local / .env (without overriding real environment variables).
for (const f of ['.env.local', '.env']) {
  const p = join(root, f);
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}
const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/$/, '');
const publicSite = /^https:\/\//.test(siteUrl) && !/localhost|127\.0\.0\.1/.test(siteUrl);
const ZIP_NAME = 'bugmark-chrome-extension.zip';
const FOLDER = 'bugmark';

if (!existsSync(join(extDir, 'manifest.json'))) {
  console.error(`✗ No manifest.json in ${extDir}\n  Set EXTENSION_DIR to the extension folder.`);
  process.exit(1);
}

// ── Stable extension ID ────────────────────────────────────────────────
// scripts/extension-key.pub (public, committed) sets the ID. The private key is only needed if you ever build a .crx;
// it's kept in scripts/.private/ (git-ignored). Losing it doesn't change the ID.
const pubPath = join(root, 'scripts/extension-key.pub');
const privPath = join(root, 'scripts/.private/extension-key.pem');
if (!existsSync(pubPath)) {
  const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  mkdirSync(dirname(privPath), { recursive: true });
  writeFileSync(privPath, privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 });
  writeFileSync(pubPath, publicKey.export({ type: 'spki', format: 'der' }).toString('base64') + '\n');
  console.log('• Generated a new extension key (scripts/extension-key.pub). Keep it — it defines the extension ID.');
}
const pubB64 = readFileSync(pubPath, 'utf8').trim();
createPublicKey({ key: Buffer.from(pubB64, 'base64'), format: 'der', type: 'spki' }); // validate
const extensionId = [...createHash('sha256').update(Buffer.from(pubB64, 'base64')).digest('hex').slice(0, 32)]
  .map((c) => String.fromCharCode(97 + parseInt(c, 16))).join('');

// ── Copy & adjust ─────────────────────────────────────────────────────
const work = mkdtempSync(join(tmpdir(), 'bugmark-pkg-'));
const out = join(work, FOLDER);
const skip = (name) => name.startsWith('.') || name === 'Claude outputs' || name === 'node_modules' || /\.(zip|pem|crx|log)$/i.test(name);
function copy(src, dst) {
  mkdirSync(dst, { recursive: true });
  for (const name of readdirSync(src)) {
    if (skip(name)) continue;
    const s = join(src, name), d = join(dst, name);
    statSync(s).isDirectory() ? copy(s, d) : cpSync(s, d);
  }
}
copy(extDir, out);

const manifestPath = join(out, 'manifest.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
manifest.key = pubB64;
if (publicSite && manifest.externally_connectable?.matches) {
  const host = new URL(siteUrl).host;
  manifest.externally_connectable.matches = [`https://${host}/*`, ...(host.startsWith('www.') ? [`https://${host.slice(4)}/*`] : [`https://www.${host}/*`])];
}
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

const configPath = join(out, 'src/shared/config.js');
const q = (v) => JSON.stringify(String(v)).slice(1, -1).replace(/'/g, "\\'");
if (existsSync(configPath)) {
  let cfg = readFileSync(configPath, 'utf8');
  if (publicSite) cfg = cfg.replace(/const WEBSITE = '[^']*'/, `const WEBSITE = '${q(siteUrl)}'`);
  if (process.env.NEXT_PUBLIC_SUPPORT_EMAIL) cfg = cfg.replace(/supportEmail: '[^']*'/, `supportEmail: '${q(process.env.NEXT_PUBLIC_SUPPORT_EMAIL)}'`);
  if (process.env.BUGMARK_GA_MEASUREMENT_ID) cfg = cfg.replace(/measurementId: '[^']*'/, `measurementId: '${q(process.env.BUGMARK_GA_MEASUREMENT_ID)}'`);
  if (process.env.BUGMARK_GA_API_SECRET) cfg = cfg.replace(/apiSecret: '[^']*'/, `apiSecret: '${q(process.env.BUGMARK_GA_API_SECRET)}'`);
  cfg = cfg.replace(/debug: true/, 'debug: false');
  writeFileSync(configPath, cfg);
}
const analyticsOn = existsSync(configPath) && /measurementId: '[^']+'/.test(readFileSync(configPath, 'utf8')) && /apiSecret: '[^']+'/.test(readFileSync(configPath, 'utf8'));

// ── Zip ────────────────────────────────────────────────────────────────
const zipPath = join(root, 'public/downloads', ZIP_NAME);
mkdirSync(dirname(zipPath), { recursive: true });
rmSync(zipPath, { force: true });
execFileSync('zip', ['-r', '-X', '-q', zipPath, FOLDER], { cwd: work });
rmSync(work, { recursive: true, force: true });

const buf = readFileSync(zipPath);
const release = {
  name: manifest.short_name || manifest.name,
  version: manifest.version,
  file: `/downloads/${ZIP_NAME}`,
  bytes: buf.length,
  sha256: createHash('sha256').update(buf).digest('hex'),
  extensionId,
  minimumChromeVersion: manifest.minimum_chrome_version || null,
  builtAt: new Date().toISOString(),
};
writeFileSync(join(root, 'lib/release.json'), JSON.stringify(release, null, 2) + '\n');

console.log(`✓ ${ZIP_NAME}  v${release.version}  ${(release.bytes / 1024).toFixed(0)} KB`);
console.log(`  Extension ID: ${extensionId}  (set NEXT_PUBLIC_EXTENSION_ID to this, or leave it empty to use lib/release.json)`);
console.log(`  Website: ${publicSite ? siteUrl : 'not set (NEXT_PUBLIC_SITE_URL) — extension keeps your-domain.com placeholders'}`);
console.log(`  Extension analytics: ${analyticsOn ? 'on' : 'off (set BUGMARK_GA_MEASUREMENT_ID and BUGMARK_GA_API_SECRET)'}`);
