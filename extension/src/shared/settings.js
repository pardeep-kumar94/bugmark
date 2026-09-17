export const DEFAULT_SETTINGS = {
  showLauncher: true,
  hiddenHosts: [],
  reviewer: '',
  launcherPos: null,
  recordSteps: true,       // remember clicks / typing / navigation as "steps to reproduce"
  recordMic: true,
  recordBodies: true,      // save request params/bodies and responses with network logs (secrets masked)         // include microphone narration in screen recordings
  brand: { company: '', logo: '', accent: '#16A34A', website: '' },
};

export async function getSettings() {
  const { settings } = await chrome.storage.local.get('settings');
  const s = settings || {};
  return { ...DEFAULT_SETTINGS, ...s, brand: { ...DEFAULT_SETTINGS.brand, ...(s.brand || {}) } };
}

export async function setSettings(patch) {
  const cur = await getSettings();
  const next = { ...cur, ...patch };
  await chrome.storage.local.set({ settings: next });
  return next;
}
