import { Suspense } from 'react';
import { Protected } from '@/components/auth/Guards';
import Library from '@/components/pages/Library';

export default function LibraryPage() {
  return (
    <Protected>
      <Suspense fallback={<div style={{ padding: 40, color: '#A0AEC0' }}>Loading library...</div>}>
        <Library />
      </Suspense>
    </Protected>
  );
}
