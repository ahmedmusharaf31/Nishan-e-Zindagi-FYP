"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { UserRole } from '@/types';
import { AlertCircle } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallbackUrl?: string;
}

export function RoleGuard({ children, allowedRoles, fallbackUrl }: RoleGuardProps) {
  const { userProfile, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const hasAccess = userProfile && allowedRoles.includes(userProfile.role);

  useEffect(() => {
    if (!isLoading && isAuthenticated && !hasAccess && fallbackUrl) {
      router.push(fallbackUrl);
    }
  }, [hasAccess, isAuthenticated, isLoading, router, fallbackUrl]);

  if (isLoading) {
    return null;
  }

  if (!hasAccess) {
    if (fallbackUrl) {
      return null; // Will redirect
    }

    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-muted-foreground text-center max-w-md">
          You don&apos;t have permission to access this page. Please contact an administrator
          if you believe this is an error.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
