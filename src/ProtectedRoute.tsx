import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProtectedRoute({
  children,
}: {
  children: ReactNode;
}) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="space-y-4 w-full max-w-md px-4">
          <Skeleton className="h-12 w-3/4 mx-auto rounded-lg" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // 1. Not logged in -> Redirect to SignIn
  if (!user) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  // 2. Logged in, checking Onboarding status
  // If user is ON /onboarding page:
  if (location.pathname === '/onboarding') {
    // If onboarding is ALREADY completed, kick them to dashboard
    if (profile?.onboarding_completed) {
      return <Navigate to="/dashboard" replace />;
    }
    // Otherwise, let them stay on onboarding
    return <>{children}</>;
  }

  // 3. User is on any OTHER protected page (e.g. /dashboard)
  // If onboarding is NOT completed, kick them to /onboarding
  if (profile && !profile.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  // 4. Everything OK
  return <>{children}</>;
}