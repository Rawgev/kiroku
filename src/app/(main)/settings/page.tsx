import { Protected } from '@/components/auth/Guards';
import Settings from '@/components/pages/Settings';

export default function SettingsPage() {
  return (
    <Protected>
      <Settings />
    </Protected>
  );
}
