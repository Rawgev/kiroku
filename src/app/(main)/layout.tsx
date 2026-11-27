import { Suspense } from 'react';
import { Layout } from '@/components/layout/Layout';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div style={{ height: '100vh', background: '#0B1020' }} />}>
      <Layout>{children}</Layout>
    </Suspense>
  );
}
