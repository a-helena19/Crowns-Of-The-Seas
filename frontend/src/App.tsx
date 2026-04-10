import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SessionProvider } from './context/SessionContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import GameLobby from './pages/GameLobby';
import GameScreen from './pages/GameScreen';
import JoinSessionPage from './pages/JoinSessionPage';
import './App.css';

function App() {
  return (
      <AuthProvider>
        <SessionProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/join/:code" element={
                <JoinSessionPage />
              } />
              <Route path="/lobby" element={
                <ProtectedRoute><GameLobby /></ProtectedRoute>
              } />
              <Route path="/game" element={
                <ProtectedRoute><GameScreen /></ProtectedRoute>
              } />
              <Route path="*" element={<Navigate to="/lobby" />} />
            </Routes>
          </BrowserRouter>
        </SessionProvider>
      </AuthProvider>
  );
}

export default App;
