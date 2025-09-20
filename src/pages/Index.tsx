import { useState } from 'react';
import { LandingPage } from '@/components/landing-page';
import { MainApp } from '@/components/main-app';

const Index = () => {
  const [showApp, setShowApp] = useState(false);

  return (
    <>
      {showApp ? (
        <MainApp onBack={() => setShowApp(false)} />
      ) : (
        <LandingPage onGetStarted={() => setShowApp(true)} />
      )}
    </>
  );
};

export default Index;