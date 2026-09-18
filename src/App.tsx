import React, { useState, useEffect } from 'react';
import { AssessmentProvider, useAssessment } from './context/AssessmentContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { VolunteerPage } from './pages/VolunteerPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { UnauthorizedCard } from './components/auth/UnauthorizedCard';
import { Smartphone } from 'lucide-react';
import { DemoPresetsPanel } from './components/volunteer/DemoPresetsPanel';
import { DemoScenario } from './data/demoScenarios';
import { UserRole } from './types/auth';

const PageRouter: React.FC = () => {
  const { currentUser, isAuthenticated } = useAuth();

  const getTargetRouteFromUrl = (): 'volunteer' | 'dashboard' | 'login' => {
    if (typeof window === 'undefined') return 'volunteer';
    const hash = window.location.hash.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();
    if (hash.includes('dashboard') || pathname.endsWith('/dashboard')) {
      return 'dashboard';
    }
    if (hash.includes('login') || pathname.endsWith('/login')) {
      return 'login';
    }
    return 'volunteer';
  };

  const [currentRoute, setCurrentRoute] = useState<'volunteer' | 'dashboard' | 'login'>(() => {
    return getTargetRouteFromUrl();
  });

  const [usePhoneFrame, setUsePhoneFrame] = useState<boolean>(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState<boolean>(false);

  const { applyDemoScenario } = useAssessment();

  useEffect(() => {
    const handleLocationChange = () => {
      const target = getTargetRouteFromUrl();
      setCurrentRoute(target);
    };

    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const navigateTo = (route: 'volunteer' | 'dashboard' | 'login') => {
    setCurrentRoute(route);
    if (route === 'dashboard') {
      window.location.hash = '/dashboard';
    } else if (route === 'login') {
      window.location.hash = '/login';
    } else {
      window.location.hash = '/volunteer';
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleLoginSuccess = (role: UserRole) => {
    if (role === 'admin') {
      navigateTo('dashboard');
    } else {
      navigateTo('volunteer');
    }
  };

  const handleLaunchScenario = (sc: DemoScenario) => {
    applyDemoScenario(sc);
    navigateTo('volunteer');
  };

  // If NOT authenticated, show the Login Page
  if (!isAuthenticated) {
    const defaultRole: UserRole = currentRoute === 'dashboard' ? 'admin' : 'volunteer';
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        defaultRole={defaultRole}
      />
    );
  }

  // If authenticated but currentRoute is 'login', redirect to role default
  if (currentRoute === 'login') {
    if (currentUser?.role === 'admin') {
      navigateTo('dashboard');
    } else {
      navigateTo('volunteer');
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-slate-900 font-sans">
      {/* SEPARATE PAGE 1: VOLUNTEER FIELD APP */}
      {currentRoute === 'volunteer' && (
        <>
          {usePhoneFrame ? (
            <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-slate-200/60">
              <div
                className="w-[390px] h-[844px] bg-[#F6F8FB] rounded-[44px] border-[8px] border-slate-300 shadow-2xl overflow-hidden flex flex-col relative"
                style={{ maxHeight: 'calc(100vh - 40px)' }}
              >
                {/* Simulated iPhone Notch */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-300/80 rounded-full z-50 pointer-events-none"></div>
                <div className="flex-1 overflow-y-auto pt-2">
                  <VolunteerPage onGoToDashboard={() => navigateTo('dashboard')} />
                </div>
              </div>
            </div>
          ) : (
            <VolunteerPage onGoToDashboard={() => navigateTo('dashboard')} />
          )}

          {/* Discreet Floating Desktop Simulator Toggle */}
          <div className="hidden lg:block fixed bottom-4 right-4 z-40">
            <button
              type="button"
              onClick={() => setUsePhoneFrame(!usePhoneFrame)}
              className="px-3 py-1.5 rounded-full bg-white/90 hover:bg-white text-slate-700 text-xs font-semibold shadow-md border border-slate-200 backdrop-blur-xs flex items-center gap-1.5 transition hover:scale-105 active:scale-95"
              title="Toggle iPhone Frame Simulator on Desktop"
            >
              <Smartphone className="w-3.5 h-3.5 text-blue-600" />
              <span>{usePhoneFrame ? 'Mobile Frame: ON' : 'Mobile Frame: OFF'}</span>
            </button>
          </div>
        </>
      )}

      {/* SEPARATE PAGE 2: COMMAND CENTER DASHBOARD */}
      {currentRoute === 'dashboard' && (
        <>
          {currentUser?.role === 'admin' ? (
            <DashboardPage onGoToVolunteer={() => navigateTo('volunteer')} />
          ) : (
            <UnauthorizedCard
              onGoBack={() => navigateTo('volunteer')}
              onSwitchAccount={() => navigateTo('login')}
            />
          )}
        </>
      )}

      {/* Demo Modal Triggered on Demand */}
      <DemoPresetsPanel
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onScenarioActivated={handleLaunchScenario}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AssessmentProvider>
        <PageRouter />
      </AssessmentProvider>
    </AuthProvider>
  );
}
