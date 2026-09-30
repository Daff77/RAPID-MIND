import React, { useState, useEffect } from 'react';
import { AssessmentProvider } from './context/AssessmentContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { VolunteerPage } from './pages/VolunteerPage';
import { DashboardPage } from './pages/DashboardPage';
import { HospitalPage } from './pages/HospitalPage';
import { LoginPage } from './pages/LoginPage';
import { UnauthorizedCard } from './components/auth/UnauthorizedCard';
import { UserRole } from './types/auth';

type RouteType = 'volunteer' | 'dashboard' | 'hospital' | 'login';

const PageRouter: React.FC = () => {
  const { currentUser, isAuthenticated } = useAuth();

  const getTargetRouteFromUrl = (): RouteType => {
    if (typeof window === 'undefined') return 'volunteer';
    const hash = window.location.hash.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();
    if (hash.includes('dashboard') || pathname.endsWith('/dashboard')) {
      return 'dashboard';
    }
    if (hash.includes('hospital') || pathname.endsWith('/hospital')) {
      return 'hospital';
    }
    if (hash.includes('login') || pathname.endsWith('/login')) {
      return 'login';
    }
    return 'volunteer';
  };

  const [currentRoute, setCurrentRoute] = useState<RouteType>(() => {
    return getTargetRouteFromUrl();
  });

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

  useEffect(() => {
    const targetHash =
      currentRoute === 'dashboard'
        ? '/dashboard'
        : currentRoute === 'hospital'
        ? '/hospital'
        : currentRoute === 'login'
        ? '/login'
        : '/volunteer';
    if (window.location.hash !== `#${targetHash}`) {
      window.location.hash = targetHash;
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentRoute]);

  const navigateTo = (route: RouteType) => {
    setCurrentRoute(route);
  };

  const handleLoginSuccess = (role: UserRole) => {
    if (role === 'admin') {
      navigateTo('dashboard');
    } else if (role === 'hospital') {
      navigateTo('hospital');
    } else {
      navigateTo('volunteer');
    }
  };

  // If NOT authenticated, show the Login Page
  if (!isAuthenticated) {
    const defaultRole: UserRole =
      currentRoute === 'dashboard'
        ? 'admin'
        : currentRoute === 'hospital'
        ? 'hospital'
        : 'volunteer';

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
    } else if (currentUser?.role === 'hospital') {
      navigateTo('hospital');
    } else {
      navigateTo('volunteer');
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {/* 1. VOLUNTEER FIELD APP */}
      {currentRoute === 'volunteer' && (
        <VolunteerPage onGoToDashboard={() => navigateTo('dashboard')} />
      )}

      {/* 2. COMMAND CENTER DASHBOARD (Admin Only) */}
      {currentRoute === 'dashboard' && (
        <>
          {currentUser?.role === 'admin' ? (
            <DashboardPage
              onGoToVolunteer={() => navigateTo('volunteer')}
              onGoToHospital={() => navigateTo('hospital')}
            />
          ) : (
            <UnauthorizedCard
              onGoBack={() =>
                navigateTo(currentUser?.role === 'hospital' ? 'hospital' : 'volunteer')
              }
              onSwitchAccount={() => navigateTo('login')}
            />
          )}
        </>
      )}

      {/* 3. HOSPITAL REFERRAL INTAKE PORTAL (Hospital & Admin) */}
      {currentRoute === 'hospital' && (
        <HospitalPage
          onGoToVolunteer={() => navigateTo('volunteer')}
          onGoToDashboard={
            currentUser?.role === 'admin' ? () => navigateTo('dashboard') : undefined
          }
        />
      )}
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
