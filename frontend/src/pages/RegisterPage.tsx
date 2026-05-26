import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser, type ApiError } from '../api/userApi';
import { useAuth } from '../context/AuthContext';
import '../style/auth.css';

export default function RegisterPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwoerter stimmen nicht ueberein.');
            return;
        }

        if (password.length < 8) {
            setError('Passwort muss mindestens 8 Zeichen lang sein.');
            return;
        }

        setLoading(true);

        try {
            const response = await registerUser(username, password);
            // Auto-login after registration
            login({ id: response.id, username: response.username, role: response.role });
            // Redirect to lobby
            navigate('/lobby');
        } catch (err) {
            const apiError = err as ApiError;
            if (apiError.errorCode === 'USERNAME_ALREADY_EXISTS') {
                setError('Dieser Benutzername ist bereits vergeben.');
            } else if (apiError.errorCode === 'VALIDATION_ERROR') {
                setError(apiError.message);
            } else {
                setError(apiError.message || 'Ein Fehler ist aufgetreten.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-panel">
                <h1>Crown of the Seas</h1>
                <p className="subtitle">Erstelle deinen Account</p>

                {error && <div className="auth-error">{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="username">Benutzername</label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Dein Benutzername"
                            required
                            minLength={1}
                            maxLength={128}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Passwort</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Mindestens 8 Zeichen"
                            required
                            minLength={8}
                            maxLength={255}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Passwort bestaetigen</label>
                        <input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Passwort wiederholen"
                            required
                        />
                    </div>

                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? 'Laden...' : 'Registrieren'}
                    </button>
                </form>

                <p className="auth-link">
                    Bereits ein Konto? <Link to="/login">Anmelden</Link>
                </p>
            </div>
        </div>
    );
}
