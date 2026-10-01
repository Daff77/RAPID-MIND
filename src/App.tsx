import React, { useEffect } from 'react';
import { AssessmentProvider } from './context/AssessmentContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { VolunteerPage } from './pages/VolunteerPage';
import { DashboardPage } from './pages/DashboardPage';
import { HospitalPage } from './pages/HospitalPage';
import { LoginPage } from './pages/LoginPage';

const PageRouter: React.FC = () => {
  const { currentUser, isAuthenticated } = useAuth();

  // Otomatis sinkronisasikan hash URL dengan hak akses peran pengguna
  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      if (window.location.hash !== '#/login') {
        window.location.hash = '/login';
      }
      return;
    }

    const targetHash =
      currentUser.role === 'admin'
        ? '/dashboard'
        : currentUser.role === 'hospital'
        ? '/hospital'
        : '/volunteer';

    if (window.location.hash !== `#${targetHash}`) {
      window.location.hash = targetHash;
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [isAuthenticated, currentUser]);

  // Jika belum login, tampilkan Laman Login
  if (!isAuthenticated || !currentUser) {
    return (
      <LoginPage
        onLoginSuccess={() => {
          // Navigasi ditangani otomatis oleh state currentUser
        }}
      />
    );
  }

  // Tampilkan antarmuka yang murni sesuai peran tanpa layar unauthorized
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {currentUser.role === 'admin' && <DashboardPage />}
      {currentUser.role === 'hospital' && <HospitalPage />}
      {currentUser.role === 'volunteer' && <VolunteerPage />}
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
