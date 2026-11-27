import { Suspense } from 'react';
import Search from '@/components/pages/Search';

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: '#A0AEC0' }}>Loading search...</div>}>
      <Search />
    </Suspense>
  );
}
