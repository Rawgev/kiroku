import { Protected } from '@/components/auth/Guards';
import Stats from '@/components/pages/Stats';

export default function StatsPage() {
  return (
    <Protected>
      <Stats />
    </Protected>
  );
}
