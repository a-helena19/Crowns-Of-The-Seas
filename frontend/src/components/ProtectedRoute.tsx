import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { ReactNode } from 'react';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (location.pathname === '/intro' || location.pathname === '/game') {
        const sessionData = sessionStorage.getItem('currentSession');
        if (!sessionData) {
            return <Navigate to="/lobby" replace />;
        }
    }

    return <>{children}</>;
}