import { useState } from 'react';
import { LandingPage } from '@/components/landing-page';
import { MainApp } from '@/components/main-app';
import { AuthPage } from '@/components/auth/auth-page';
import { useAuth } from '@/hooks/use-auth';

const Index = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'auth' | 'app'>('landing');
  const { user, isLoading } = useAuth();

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/5 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleGetStarted = () => {
    if (user) {
      setCurrentView('app');
    } else {
      setCurrentView('auth');
    }
  };

  return (
    <>
      {currentView === 'landing' && (
        <LandingPage onGetStarted={handleGetStarted} />
      )}
      {currentView === 'auth' && (
        <AuthPage onBack={() => setCurrentView('landing')} />
      )}
      {currentView === 'app' && (
        <MainApp onBack={() => setCurrentView('landing')} />
      )}
    </>
  );
};

export default Index;