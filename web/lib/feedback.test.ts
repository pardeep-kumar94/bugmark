import { test } from 'node:test';
import assert from 'node:assert/strict';
import { browserFamily, deviceType, isAllowedOrigin, parseFeedback, refHost, NOTE_MAX } from './feedback.ts';

const CHROME_MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const EDGE_WIN = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0';
const SAFARI_IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const FIREFOX_LINUX = 'Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0';
const CHROME_ANDROID_TABLET = 'Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const CHROME_ANDROID_PHONE = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36';

test('browserFamily', () => {
  assert.equal(browserFamily(CHROME_MAC), 'chrome');
  assert.equal(browserFamily(EDGE_WIN), 'edge');
  assert.equal(browserFamily(SAFARI_IPHONE), 'safari');
  assert.equal(browserFamily(FIREFOX_LINUX), 'firefox');
  assert.equal(browserFamily(''), 'other');
});

test('deviceType', () => {
  assert.equal(deviceType(CHROME_MAC), 'desktop');
  assert.equal(deviceType(SAFARI_IPHONE), 'mobile');
  assert.equal(deviceType(CHROME_ANDROID_PHONE), 'mobile');
  assert.equal(deviceType(CHROME_ANDROID_TABLET), 'tablet');
});

test('refHost keeps only the hostname', () => {
  assert.equal(refHost('https://www.google.com/search?q=bug+report'), 'google.com');
  assert.equal(refHost('news.ycombinator.com'), 'news.ycombinator.com');
  assert.equal(refHost('not a url at all'), '');
  assert.equal(refHost(42), '');
  assert.equal(refHost(''), '');
});

test('valid exit answer', () => {
  const r = parseFeedback({ kind: 'exit', reasons: ['unclear', 'price'], note: '  too pricey  ', page: '/', ref: 'https://www.google.com/x', utm: 'producthunt' }, CHROME_MAC);
  assert.equal(r.status, 'valid');
  if (r.status !== 'valid') return;
  assert.deepEqual(r.doc, {
    kind: 'exit', reasons: ['unclear', 'price'], note: 'too pricey', page: '/', ref: 'google.com', utm: 'producthunt',
    version: '', browser: 'chrome', device: 'desktop',
  });
});

test('raw user agent is never stored', () => {
  const r = parseFeedback({ kind: 'exit', reasons: ['browsing'] }, CHROME_MAC);
  assert.equal(r.status, 'valid');
  assert.ok(!JSON.stringify(r).includes('Macintosh'));
});

test('unknown, duplicate and wrong-kind reasons are dropped; max 8', () => {
  const r = parseFeedback({ kind: 'exit', reasons: ['unclear', 'unclear', 'hacker', 7, 'bug'] }, '');
  assert.equal(r.status, 'valid');
  if (r.status === 'valid') assert.deepEqual(r.doc.reasons, ['unclear']); // 'bug' is an uninstall reason
  const many = parseFeedback({ kind: 'uninstall', reasons: ['not_needed', 'missing_feature', 'bug', 'hard_to_use', 'install_hassle', 'switched', 'privacy', 'other'], version: '1.4.0' }, '');
  assert.equal(many.status, 'valid');
  if (many.status === 'valid') { assert.equal(many.doc.reasons.length, 8); assert.equal(many.doc.version, '1.4.0'); }
});

test('version is ignored for exit answers', () => {
  const r = parseFeedback({ kind: 'exit', reasons: ['price'], version: '9.9.9' }, '');
  assert.equal(r.status === 'valid' && r.doc.version, '');
});

test('note is trimmed and capped', () => {
  const r = parseFeedback({ kind: 'exit', reasons: [], note: 'x'.repeat(5000) }, '');
  assert.equal(r.status === 'valid' && r.doc.note.length, NOTE_MAX);
});

test('note alone is enough', () => {
  assert.equal(parseFeedback({ kind: 'exit', note: 'confusing pricing' }, '').status, 'valid');
});

test('invalid inputs', () => {
  assert.deepEqual(parseFeedback(null, ''), { status: 'invalid', error: 'bad_body' });
  assert.deepEqual(parseFeedback('hi', ''), { status: 'invalid', error: 'bad_body' });
  assert.deepEqual(parseFeedback({ kind: 'nope', reasons: ['unclear'] }, ''), { status: 'invalid', error: 'bad_kind' });
  assert.deepEqual(parseFeedback({ kind: 'exit', reasons: ['hacker'], note: '   ' }, ''), { status: 'invalid', error: 'empty' });
  assert.deepEqual(parseFeedback({ kind: 'exit', reasons: 'unclear' }, ''), { status: 'invalid', error: 'empty' });
});

test('honeypot marks spam', () => {
  assert.deepEqual(parseFeedback({ kind: 'exit', reasons: ['unclear'], website: 'http://spam.example' }, ''), { status: 'spam' });
});

test('isAllowedOrigin: same-origin is ok', () => {
  assert.equal(isAllowedOrigin('https://bugmark.app', 'same-origin', 'https://bugmark.app', false), true);
  assert.equal(isAllowedOrigin(null, 'same-origin', 'https://bugmark.app', false), true);
});

test('isAllowedOrigin: cross-site is rejected', () => {
  assert.equal(isAllowedOrigin('https://evil.example', null, 'https://bugmark.app', false), false);
  assert.equal(isAllowedOrigin(null, 'cross-site', 'https://bugmark.app', false), false);
  assert.equal(isAllowedOrigin('https://bugmark.app', 'cross-site', 'https://bugmark.app', false), false);
});

test('isAllowedOrigin: missing headers are allowed (non-browser clients rate-limited at the edge)', () => {
  assert.equal(isAllowedOrigin(null, null, 'https://bugmark.app', false), true);
});

test('isAllowedOrigin: localhost origin only allowed in dev', () => {
  assert.equal(isAllowedOrigin('http://localhost:3000', null, 'https://bugmark.app', true), true);
  assert.equal(isAllowedOrigin('http://127.0.0.1:3000', null, 'https://bugmark.app', true), true);
  assert.equal(isAllowedOrigin('http://localhost:3000', null, 'https://bugmark.app', false), false);
});

test('long page and utm are capped', () => {
  const r = parseFeedback({ kind: 'exit', reasons: ['price'], page: '/' + 'a'.repeat(500), utm: 'u'.repeat(500) }, '');
  assert.equal(r.status, 'valid');
  if (r.status === 'valid') { assert.equal(r.doc.page.length, 200); assert.equal(r.doc.utm.length, 60); }
});
