import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const alt = 'Bugmark — Bug reports developers can actually fix';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const fontDir = join(process.cwd(), 'node_modules/geist/dist/fonts/geist-mono');

export default async function OpengraphImage() {
  const [regular, bold] = await Promise.all([
    readFile(join(fontDir, 'GeistMono-Regular.ttf')),
    readFile(join(fontDir, 'GeistMono-SemiBold.ttf')),
  ]);
  const green = '#4ADE80';
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, background: '#090B0F', color: '#E6EDF3', position: 'relative', fontFamily: 'Geist Mono' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', backgroundImage: 'linear-gradient(to right, rgba(255,255,255,.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.045) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        <div style={{ position: 'absolute', right: -160, bottom: -260, width: 700, height: 700, borderRadius: 700, background: 'linear-gradient(135deg, #4ADE80, #22D3EE)', opacity: 0.16, display: 'flex' }} />
        <div style={{ position: 'absolute', left: 0, top: 0, width: 1200, height: 6, background: 'linear-gradient(90deg, #4ADE80, #2DD4BF 55%, #22D3EE)', display: 'flex' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg,#4ADE80,#2DD4BF 55%,#22D3EE)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="52" height="52" viewBox="0 0 40 40"><path d="M8.5 14V10.5a2 2 0 0 1 2-2H14M26 8.5h3.5a2 2 0 0 1 2 2V14M31.5 26v3.5a2 2 0 0 1-2 2H26M14 31.5h-3.5a2 2 0 0 1-2-2V26" stroke="#03140A" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" /><path d="M15.2 18.6 12.6 17M14.8 22.4h-2.6M15.4 26 13 27.6M24.8 18.6l2.6-1.6M25.2 22.4h2.6M24.6 26l2.4 1.6M18.6 13.2 17 11.2M21.4 13.2l1.6-2" stroke="#03140A" strokeWidth="1.6" strokeLinecap="round" fill="none" /><ellipse cx="20" cy="14.9" rx="2.9" ry="2.6" fill="#03140A" /><ellipse cx="20" cy="22.4" rx="5.2" ry="6.2" fill="#03140A" /><path d="M20 17.6v9.8" stroke={green} strokeWidth="1.5" strokeLinecap="round" /></svg>
          </div>
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 600, letterSpacing: -1.5 }}>bugmark<span style={{ color: green }}>_</span></div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontSize: 24, color: '#6B7684', marginBottom: 18 }}><span style={{ color: green }}>❯</span>&nbsp;bugmark capture --with-context</div>
          <div style={{ fontSize: 76, fontWeight: 600, letterSpacing: -5, lineHeight: 1.04, display: 'flex', flexWrap: 'wrap' }}>
            Bug reports devs&nbsp;
            <span style={{ background: 'linear-gradient(95deg,#4ADE80,#2DD4BF 50%,#22D3EE)', backgroundClip: 'text', color: 'transparent' }}>can actually fix.</span>
          </div>
          <div style={{ fontSize: 26, color: '#9BA6B2', marginTop: 22, maxWidth: 900 }}>
            Screenshots or video, plus steps, console logs and network payloads. Straight to GitHub.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14, fontSize: 21, color: '#C9D1D9' }}>
          <span>Chrome extension</span><span style={{ color: '#2B3440' }}>·</span><span>No account</span><span style={{ color: '#2B3440' }}>·</span><span style={{ color: green }}>100% free</span>
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: 'Geist Mono', data: regular, weight: 400, style: 'normal' }, { name: 'Geist Mono', data: bold, weight: 600, style: 'normal' }] },
  );
}
