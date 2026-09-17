const msg = document.getElementById('msg');
async function ask() {
  try {
    const s = await navigator.mediaDevices.getUserMedia({ audio: true });
    s.getTracks().forEach((t) => t.stop());
    msg.className = 'msg ok';
    msg.textContent = 'Microphone enabled. Go back to your tab and start the recording again.';
    document.getElementById('allow').textContent = 'Close this tab';
    document.getElementById('allow').onclick = () => window.close();
    setTimeout(() => window.close(), 2500);
  } catch (e) {
    msg.className = 'msg err';
    msg.textContent = e.name === 'NotAllowedError'
      ? 'Microphone is blocked. Click the icon in the address bar to allow it, or record without narration (Settings → Recording).'
      : `Couldn’t access a microphone: ${e.message || e.name}`;
  }
}
document.getElementById('allow').addEventListener('click', ask);
