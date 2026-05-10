import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

export default function ProtectedRoute({ children }: { children: ReactNode }) {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (location.pathname === '/intro') {
        const sessionData = sessionStorage.getItem('currentSession');
        if (!sessionData) {
            return <Navigate to="/lobby" replace />;
        }
        const session = JSON.parse(sessionData);
        if (session.status !== 'FACTION_SELECTION' && session.status !== 'RUNNING') {
            return <Navigate to="/session-waiting" replace />;
        }
    }

    if (location.pathname === '/game') {
        const sessionData = sessionStorage.getItem('currentSession');
        if (!sessionData) {
            return <Navigate to="/lobby" replace />;
        }
        const session = JSON.parse(sessionData);
        const gameStarted = sessionStorage.getItem('gameStarted') === 'true';
        if (session.status !== 'RUNNING' && !gameStarted) {
            return <Navigate to="/session-waiting" replace />;
        }
    }

    return <>{children}</>;
}