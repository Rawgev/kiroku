import { Protected, AdminRoute } from '@/components/auth/Guards';
import { Admin } from '@/components/pages/Pages';

export default function AdminPage() {
  return (
    <Protected>
      <AdminRoute>
        <Admin />
      </AdminRoute>
    </Protected>
  );
}
