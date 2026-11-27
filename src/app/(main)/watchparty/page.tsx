import { Protected } from '@/components/auth/Guards';
import { WatchPartyPage } from '@/components/pages/Pages';

export default function WatchPartyRoute() {
  return (
    <Protected>
      <WatchPartyPage />
    </Protected>
  );
}
