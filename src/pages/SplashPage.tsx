import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Activity } from 'lucide-react';

export default function SplashPage() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(() => {
      if (user && profile) {
        if (!profile.onboarding_completed) {
          navigate('/onboarding');
        } else {
          navigate('/dashboard');
        }
      } else {
        navigate('/signin');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [user, profile, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="text-center space-y-6 animate-fade-in">
        <div className="flex justify-center">
          <div className="relative">
            <Activity className="h-24 w-24 text-primary animate-pulse" />
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
          </div>
        </div>
        <h1 className="text-4xl xl:text-5xl font-bold gradient-text">
          MediCare Companion
        </h1>
        <p className="text-lg text-muted-foreground">
          Your Health, Our Priority
        </p>
        <div className="flex justify-center pt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    </div>
  );
}
