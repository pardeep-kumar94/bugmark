// Real screenshots of the Bugmark extension (captured from v1.6 on a demo booking site).
export const screens = {
  heroCapture: { src: '/screens/hero-capture.webp', w: 2400, h: 1368, alt: 'Bugmark feedback panel on a checkout page: annotated declined-payment error, title, comment, priority, auto-recorded steps to reproduce and a “Create GitHub issue” toggle' },
  annotate: { src: '/screens/annotate.webp', w: 2400, h: 1368, alt: 'Bugmark toolbar over a live checkout page with a rectangle, arrow, numbered pin and text label marking a payment error' },
  captureMenu: { src: '/screens/capture-menu.webp', w: 1920, h: 700, alt: 'Capture menu: visible area, full page, in 3 seconds, mobile · tablet · desktop and record video' },
  inspector: { src: '/screens/inspector.webp', w: 1280, h: 800, alt: 'Element inspector highlighting a card title with its size badge' },
  recording: { src: '/screens/recording.webp', w: 2400, h: 1083, alt: 'Recording bar with timer, microphone indicator and Stop button above a live page' },
  recordingBar: { src: '/screens/recording-bar.webp', w: 960, h: 300, alt: 'Recording bar with timer, microphone indicator and Stop button' },
  videoPlayer: { src: '/screens/video-player.webp', w: 2400, h: 1356, alt: 'Screen recording playing back inside the Bugmark report' },
  networkPayload: { src: '/screens/network-payload.webp', w: 1720, h: 1314, alt: 'Network tab showing a failed POST /api/payments/intents with its JSON request payload and redacted card fields' },
  networkResponse: { src: '/screens/network-response.webp', w: 1720, h: 1314, alt: 'Network tab showing the 402 JSON response body for a declined payment' },
  console: { src: '/screens/console.webp', w: 1720, h: 1314, alt: 'Console tab listing log, warning and error messages recorded at capture time' },
  steps: { src: '/screens/steps.webp', w: 1720, h: 1314, alt: 'Steps to reproduce recorded automatically: open checkout, apply promo, type name, click Confirm and pay' },
  breakpoints: { src: '/screens/breakpoints.webp', w: 2400, h: 1016, alt: 'One capture rendered at mobile, tablet and desktop widths side by side' },
  beforeAfter: { src: '/screens/before-after.webp', w: 2400, h: 753, alt: 'Before and after screenshots of a card layout fix shown side by side' },
  dashboard: { src: '/screens/dashboard.webp', w: 2400, h: 1368, alt: 'Bugmark report dashboard with recordings, before/after shots, breakpoints, network and console counts' },
  githubDialog: { src: '/screens/github-dialog.webp', w: 1036, h: 830, alt: 'Create GitHub issue dialog with repository, title, labels and attachment options' },
  exportDialog: { src: '/screens/export-dialog.webp', w: 1036, h: 1172, alt: 'Export report dialog with HTML, PDF and CSV formats' },
  reportCover: { src: '/screens/report-cover.webp', w: 2400, h: 1688, alt: 'Exported HTML report cover with summary stats and issue index' },
  reportItem: { src: '/screens/report-item.webp', w: 1952, h: 1900, alt: 'Exported report detail page with screenshot, page context, steps and failed network requests' },
  installPage: { src: '/screens/install-extensions-page.webp', w: 1600, h: 525, alt: 'chrome://extensions with Developer mode switched on, the Load unpacked button, and Bugmark 1.6.0 installed' },
  settingsGithub: { src: '/screens/settings-github.webp', w: 1424, h: 1134, alt: 'GitHub settings: connected account, default repository, screenshot branch and labels' },
} as const;
export type Screen = (typeof screens)[keyof typeof screens];
