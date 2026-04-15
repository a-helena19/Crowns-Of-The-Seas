import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser, type ApiError } from '../api/userApi';
import '../style/auth.css';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const registered = searchParams.get('registered') === 'true';

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const user = await loginUser(username, password);
            login(user);

            // Check if there's a redirect parameter (e.g., /join/ABC123)
            const redirect = searchParams.get('redirect');
            if (redirect) {
                navigate(redirect);
            } else {
                navigate('/lobby');
            }
        } catch (err) {
            const apiError = err as ApiError;
            if (apiError.errorCode === 'INVALID_CREDENTIALS') {
                setError('Falscher Benutzername oder Passwort.');
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
                <p className="subtitle">Melde dich an, Captain</p>

                {registered && (
                    <div className="auth-success">
                        Registrierung erfolgreich! Du kannst dich jetzt anmelden.
                    </div>
                )}

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
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Passwort</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Dein Passwort"
                            required
                        />
                    </div>

                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? 'Laden...' : 'Anmelden'}
                    </button>
                </form>

                <p className="auth-link">
                    Noch kein Konto? <Link to="/register">Registrieren</Link>
                </p>
            </div>
        </div>
    );
}
