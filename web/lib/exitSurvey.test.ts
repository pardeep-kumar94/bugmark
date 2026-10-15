import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COOLDOWN_MS, canShow, inCooldown, isBlockedPath, isExitIntent, parseLastShown, type ShowState } from './exitSurvey.ts';

const NOW = 1_760_000_000_000;
const ok: ShowState = { path: '/', lastShown: null, now: NOW, installClicked: false, extensionInstalled: false, consentPending: false, shownThisPage: false };

test('shows for a fresh visitor on the home page', () => {
  assert.equal(canShow(ok), true);
});

test('never after an install click', () => {
  assert.equal(canShow({ ...ok, installClicked: true }), false);
});

test('never while the consent banner is pending', () => {
  assert.equal(canShow({ ...ok, consentPending: true }), false);
});

test('never when the extension is installed', () => {
  assert.equal(canShow({ ...ok, extensionInstalled: true }), false);
});

test('at most once per page load (covers missing localStorage)', () => {
  assert.equal(canShow({ ...ok, shownThisPage: true }), false);
});

test('30-day cooldown', () => {
  assert.equal(canShow({ ...ok, lastShown: NOW - 1000 }), false);
  assert.equal(canShow({ ...ok, lastShown: NOW - COOLDOWN_MS + 1 }), false);
  assert.equal(canShow({ ...ok, lastShown: NOW - COOLDOWN_MS - 1 }), true);
  assert.equal(inCooldown(null, NOW), false);
});

test('blocked paths', () => {
  for (const p of ['/account', '/install', '/uninstalled', '/privacy', '/terms', '/account/billing']) {
    assert.equal(isBlockedPath(p), true, p);
    assert.equal(canShow({ ...ok, path: p }), false, p);
  }
  for (const p of ['/', '/guides/how-to-write-a-bug-report', '/alternatives/jam', '/installer-guide']) {
    assert.equal(isBlockedPath(p), false, p);
  }
});

test('parseLastShown tolerates junk and empty storage', () => {
  assert.equal(parseLastShown(null), null);
  assert.equal(parseLastShown(''), null);
  assert.equal(parseLastShown('banana'), null);
  assert.equal(parseLastShown('-5'), null);
  assert.equal(parseLastShown(String(NOW)), NOW);
});

test('exit intent only when the pointer leaves through the top of the window', () => {
  assert.equal(isExitIntent({ clientY: 0, relatedTarget: null }), true);
  assert.equal(isExitIntent({ clientY: -4, relatedTarget: null }), true);
  assert.equal(isExitIntent({ clientY: 300, relatedTarget: null }), false); // left through a side/bottom edge
  assert.equal(isExitIntent({ clientY: 0, relatedTarget: {} }), false); // moved onto another element
});
