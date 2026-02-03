"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading, userProfile } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && userProfile) {
        // Redirect based on role
        switch (userProfile.role) {
          case 'admin':
            router.push('/admin');
            break;
          case 'rescuer':
            router.push('/rescuer');
            break;
          case 'public':
            router.push('/public');
            break;
          default:
            router.push('/login');
        }
      } else {
        router.push('/login');
      }
    }
  }, [isAuthenticated, isLoading, userProfile, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
