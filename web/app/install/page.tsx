import { redirect } from 'next/navigation';
import { ctaHref } from '@/lib/site';

// The extension now lives on the Chrome Web Store, so /install is just a redirect
// to the store listing. The route is kept so old links, the sitemap entry and the
// uninstall "reinstall" button keep resolving.
export default function InstallPage() {
  redirect(ctaHref);
}
