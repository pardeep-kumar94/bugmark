// Offscreen document: records the tab (tabCapture stream id, or getDisplayMedia picker as a fallback),
// mixes in the microphone, and stores the finished WebM in Bugmark's IndexedDB.
import { putMedia } from '../shared/db.js';

const MAX_MS = 5 * 60 * 1000;
let session = null;

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.target !== 'offscreen') return false;
  const run = { 'rec:start': start, 'rec:stop': () => stop('user'), 'rec:status': status }[msg.type];
  if (!run) return false;
  Promise.resolve(run(msg)).then((r) => sendResponse({ ok: true, ...r }), (e) => sendResponse({ ok: false, error: e.message || String(e), name: e.name }));
  return true;
});

function status() {
  return session ? { recording: true, startedAt: session.startedAt, mic: session.mic, source: session.source } : { recording: false };
}

function withTimeout(p, ms, label) {
  return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(Object.assign(new Error(label), { name: 'TimeoutError' })), ms))]);
}

async function start({ streamId, mic }) {
  if (session) throw new Error('A recording is already running');
  let screen, source;
  if (streamId) {
    source = 'tab';
    screen = await navigator.mediaDevices.getUserMedia({
      audio: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: streamId } },
      video: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: streamId, maxWidth: 1920, maxHeight: 1080, maxFrameRate: 30 } },
    });
  } else {
    source = 'display';
    screen = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: 30, width: { max: 1920 }, height: { max: 1080 } },
      audio: true, preferCurrentTab: false, selfBrowserSurface: 'exclude', surfaceSwitching: 'exclude', monitorTypeSurfaces: 'include',
    });
  }

  let micStream = null, micError = '';
  if (mic) {
    try { micStream = await withTimeout(navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }), 4000, 'Microphone permission needed'); }
    catch (e) { micError = e.name === 'NotAllowedError' || e.name === 'TimeoutError' ? 'permission' : (e.message || e.name); }
  }

  const ctx = new AudioContext();
  const dest = ctx.createMediaStreamDestination();
  const tabAudio = screen.getAudioTracks();
  if (tabAudio.length) {
    const src = ctx.createMediaStreamSource(new MediaStream(tabAudio));
    src.connect(dest);
    if (source === 'tab') src.connect(ctx.destination); // tabCapture mutes the tab — play it back to the user
  }
  if (micStream) ctx.createMediaStreamSource(micStream).connect(dest);

  const tracks = [...screen.getVideoTracks()];
  if (tabAudio.length || micStream) tracks.push(...dest.stream.getAudioTracks());
  const mixed = new MediaStream(tracks);
  const mimeType = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find((t) => MediaRecorder.isTypeSupported(t));
  const recorder = new MediaRecorder(mixed, { mimeType, videoBitsPerSecond: 2_500_000, audioBitsPerSecond: 96_000 });
  const chunks = [];
  recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };

  const preview = document.getElementById('preview');
  preview.srcObject = new MediaStream(screen.getVideoTracks());
  preview.play().catch(() => {});

  session = { recorder, chunks, screen, micStream, ctx, preview, startedAt: Date.now(), mic: !!micStream, source, mimeType };
  screen.getVideoTracks()[0].addEventListener('ended', () => stop('ended')); // "Stop sharing" / tab closed
  session.timer = setTimeout(() => stop('limit'), MAX_MS);
  recorder.start(1000);
  return { startedAt: session.startedAt, mic: !!micStream, micError, source, maxMs: MAX_MS };
}

async function stop(reason) {
  const s = session;
  if (!s || s.stopping) return {};
  s.stopping = true;
  clearTimeout(s.timer);
  const poster = grabFrame(s.preview);
  await new Promise((resolve) => { s.recorder.onstop = resolve; try { s.recorder.stop(); } catch { resolve(); } });
  s.screen.getTracks().forEach((t) => t.stop());
  s.micStream?.getTracks().forEach((t) => t.stop());
  s.ctx.close().catch(() => {});
  session = null;

  const blob = new Blob(s.chunks, { type: 'video/webm' });
  const duration = Date.now() - s.startedAt;
  const mediaId = crypto.randomUUID();
  let result;
  if (blob.size < 1000) {
    result = { error: 'The recording was empty.' };
  } else {
    await putMedia(mediaId, blob);
    result = { video: { mediaId, mime: 'video/webm', size: blob.size, duration, mic: s.mic, width: poster.width, height: poster.height }, poster };
  }
  chrome.runtime.sendMessage({ type: 'bugmark:recDone', reason, ...result }).catch(() => {});
  return {};
}

function grabFrame(video) {
  const w = video.videoWidth || 1280, h = video.videoHeight || 720;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  try { g.drawImage(video, 0, 0, w, h); } catch { g.fillStyle = '#0E1217'; g.fillRect(0, 0, w, h); }
  const image = c.toDataURL('image/jpeg', 0.88);
  const tw = Math.min(720, w), th = Math.round(Math.min(h, w * 0.75) * (tw / w));
  const t = document.createElement('canvas');
  t.width = tw; t.height = th;
  t.getContext('2d').drawImage(c, 0, 0, w, Math.min(h, w * 0.75), 0, 0, tw, th);
  return { image, thumb: t.toDataURL('image/jpeg', 0.82), width: w, height: h };
}
