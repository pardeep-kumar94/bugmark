import Link from 'next/link';
import { Fragment } from 'react';

// Renders the tiny inline syntax used by lib/content: **bold**, `code`, [text](href).
const TOKEN = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

export function RichText({ text }: { text: string }) {
  const parts = text.split(TOKEN).filter(Boolean);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="font-semibold text-ink">{part.slice(2, -2)}</strong>;
        if (part.startsWith('`') && part.endsWith('`')) return <code key={i} className="code">{part.slice(1, -1)}</code>;
        const m = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
        if (m) {
          const [, label, href] = m;
          const cls = 'font-medium text-accent underline decoration-accent/30 underline-offset-4 hover:decoration-accent';
          if (href.startsWith('/')) return <Link key={i} href={href} className={cls}>{label}</Link>;
          return <a key={i} href={href} className={cls} target="_blank" rel="noopener">{label}</a>;
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

/** Plain text (for structured data, excerpts). */
export const plain = (text: string) => text.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
