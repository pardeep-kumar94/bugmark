import type { ReactNode } from 'react';
import { ctaHref, ctaExternal } from '@/lib/site';

/**
 * The "Add to Chrome" call-to-action link. Points at the Chrome Web Store
 * listing (site.chromeStoreUrl) when published, otherwise the /install page.
 * Opens the store in a new tab so visitors don't lose the site.
 */
export function InstallLink({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <a href={ctaHref} className={className} {...(ctaExternal ? { target: '_blank', rel: 'noopener' } : {})}>
      {children}
    </a>
  );
}
