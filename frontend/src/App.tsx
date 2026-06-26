// src/App.tsx
import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SessionProvider } from './context/SessionContext';
import { FullscreenProvider, useFullscreen } from './context/FullscreenContext';
import { AudioSettingsProvider } from './audio/AudioSettingsContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import GameLobby from './pages/GameLobby';
import SessionWaitingScreen from './pages/SessionWaitingScreen';
import JoinSessionPage from './pages/JoinSessionPage';
import GameScreen from './scenes/GameScreen';
import IntroAnimation from './pages/IntroAnimation.tsx';
import './App.css';
import GameOverStandalone from "./components/GameOverStandalone.tsx";
import AdminPage from "./pages/AdminPage.tsx";
import StartScreen from './pages/StartScreen';

function AppRoutes() {
    const appShellRef = useRef<HTMLDivElement | null>(null);
    const { registerFullscreenTarget } = useFullscreen();

    useEffect(() => {
        registerFullscreenTarget(appShellRef.current);
        return () => registerFullscreenTarget(null);
    }, [registerFullscreenTarget]);

    return (
        <div ref={appShellRef}>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/join/:code" element={<JoinSessionPage />} />
                    <Route path="/lobby" element={
                        <ProtectedRoute><GameLobby /></ProtectedRoute>
                    } />
                    <Route path="/session-waiting" element={
                        <ProtectedRoute><SessionWaitingScreen /></ProtectedRoute>
                    } />
                    <Route path="/intro" element={
                        <ProtectedRoute><IntroAnimation /></ProtectedRoute>
                    } />
                    <Route path="/game" element={
                        <ProtectedRoute><GameScreen /></ProtectedRoute>
                    } />
                    <Route path="/" element={<StartScreen />} />
                    <Route path="*" element={<Navigate to="/" />} />
                    <Route path="/game-over" element={
                        <ProtectedRoute><GameOverStandalone /></ProtectedRoute>
                    } />
                    <Route path="/admin" element={
                        <ProtectedRoute><AdminPage /></ProtectedRoute>
                    } />
                </Routes>
            </BrowserRouter>
        </div>
    );
}

function App() {
    return (
        <AuthProvider>
            <SessionProvider>
                <FullscreenProvider>
                    <AudioSettingsProvider>
                        <AppRoutes />
                    </AudioSettingsProvider>
                </FullscreenProvider>
            </SessionProvider>
        </AuthProvider>
    );
}

export default App;
