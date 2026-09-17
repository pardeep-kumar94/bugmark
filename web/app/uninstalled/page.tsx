import type { Metadata } from 'next';
import { SimpleShell } from '@/components/SimpleShell';
import { UninstallSurvey } from '@/components/UninstallSurvey';

export const metadata: Metadata = {
  title: 'Sorry to see you go',
  description: 'Tell us why you removed Bugmark.',
  robots: { index: false, follow: false },
};

export default function UninstalledPage() {
  return (
    <SimpleShell>
      <UninstallSurvey />
    </SimpleShell>
  );
}
