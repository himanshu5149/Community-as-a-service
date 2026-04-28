import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader2, Lock } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center gap-6 text-white">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Authenticating Session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !isAdmin) {
    return (
      <div className="min-h-screen bg-bg-dark flex flex-col items-center justify-center gap-6 text-white p-10">
        <div className="w-24 h-24 bg-primary/10 border border-primary/20 rounded-[2.5rem] flex items-center justify-center">
          <Lock className="w-12 h-12 text-primary" />
        </div>
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tighter italic">Access <span className="text-primary not-italic">Denied.</span></h1>
          <p className="text-gray-400 max-w-sm font-medium">Your credentials do not have clearance for the Central Intelligence Hub.</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="mt-8 px-10 py-5 bg-white text-bg-dark rounded-2xl font-black uppercase tracking-widest text-[10px]"
          >
            Return to Surface
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
