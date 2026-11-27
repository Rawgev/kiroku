'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Protected } from '@/components/auth/Guards';

function ProfileRedirectInner() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace(`/user/${user.username}`);
    }
  }, [user, router]);

  return null;
}

export default function ProfileRedirectPage() {
  return (
    <Protected>
      <ProfileRedirectInner />
    </Protected>
  );
}
