"use client";

import { AuthScreen } from '@/components/enterprise/AuthScreen';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();

  return (
    <AuthScreen
      initialMode="register"
      isModal={false}
      onAuthenticated={(user) => {
        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem('drishti_session_active', 'true');
            sessionStorage.setItem('drishti_session_user', JSON.stringify(user));
            localStorage.setItem('drishti_cached_user', JSON.stringify(user));
            localStorage.setItem('easytrader_user', JSON.stringify(user));
            localStorage.setItem('drishti_has_seen_overview', 'true');
            window.location.href = '/';
          } catch {
            router.push('/');
          }
        } else {
          router.push('/');
        }
      }}
    />
  );
}
