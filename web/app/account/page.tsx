import type { Metadata } from 'next';
import { SimpleShell } from '@/components/SimpleShell';
import { Account } from '@/components/Account';

export const metadata: Metadata = {
  title: 'Account',
  description: 'Sign in to manage your Bugmark Pro license.',
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <SimpleShell>
      <Account />
    </SimpleShell>
  );
}
