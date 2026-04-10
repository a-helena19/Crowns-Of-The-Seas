import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../style/auth.css';

export default function GameScreen() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div style={{
            width: '100%',
            height: '100vh',
            background: '#1a0e07',
            color: '#f5e6c8',
            fontFamily: "'Press Start 2P', Georgia, serif",
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
        }}>
            <h1 style={{ color: '#d1ba7e', fontSize: '24px', textShadow: '2px 2px 0 #1a0a02' }}>
                Crown of the Seas
            </h1>
            <p style={{ color: '#8a7a5a', fontSize: '12px' }}>
                Willkommen, {user?.username}!
            </p>
            <p style={{ color: '#5a4a30', fontSize: '10px' }}>
                Das Spiel wird bald hier geladen...
            </p>
            <button
                onClick={handleLogout}
                className="auth-btn"
                style={{ fontSize: '12px', padding: '10px 20px' }}
            >
                Ausloggen
            </button>
        </div>
    );
}
