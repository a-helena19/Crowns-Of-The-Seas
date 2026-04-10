import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import GameLobby from './pages/GameLobby';
import GameScreen from './pages/GameScreen';
import './App.css';

function App() {
  return (
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/lobby" element={
              <ProtectedRoute><GameLobby /></ProtectedRoute>
            } />
            <Route path="/game" element={
              <ProtectedRoute><GameScreen /></ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
  );
}

export default App;
