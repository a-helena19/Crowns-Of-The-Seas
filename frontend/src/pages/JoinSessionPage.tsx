import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSessionContext } from '../context/useSessionContext';

export default function JoinSessionPage() {
    const { code } = useParams<{ code: string }>();
    const { user } = useAuth();
    const { joinSession } = useSessionContext();
    const navigate = useNavigate();
    const hasAttemptedJoin = useRef(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // If not authenticated, redirect to login with return URL
        if (!user) {
            console.log('Not authenticated, redirecting to loginRedirect');
            navigate(`/login?redirect=/join/${code}`);
            return;
        }

        // Prevent double execution
        if (hasAttemptedJoin.current) {
            console.log('Already attempted to join, skipping');
            return;
        }

        hasAttemptedJoin.current = true;

        // If authenticated, automatically join the session
        const joinSessionAsync = async () => {
            setLoading(true);
            setError(null);

            if (!code) {
                console.log('No code provided');
                setError('Kein Session-Code vorhanden.');
                setLoading(false);
                return;
            }

            try {
                console.log('Attempting to join session with code:', code, 'as user:', user.username);
                const session = await joinSession(code, user.username);

                console.log('Join result:', session);

                if (session) {
                    console.log('Successfully joined, storing data and navigating to /session-waiting');
                    // Store session data
                    sessionStorage.setItem('currentSession', JSON.stringify(session));
                    sessionStorage.setItem('userRole', 'guest');
                    sessionStorage.setItem('playerName', user.username);

                    // Redirect to session waiting screen
                    navigate('/session-waiting');
                }
            } catch (error: unknown) {
                console.error('Error joining session:', error);

                const axiosError = error as { response?: { data?: { code?: string; message?: string }; status?: number } };

                console.log('Error details:', {
                    status: axiosError.response?.status,
                    code: axiosError.response?.data?.code,
                    message: axiosError.response?.data?.message
                });

                // Spezifische Fehlermeldungen basierend auf API-Antwort
                if (axiosError.response?.data?.code === 'PLAYER_ALREADY_IN_SESSION') {
                    setError('Du bist bereits dieser Session beigetreten! Bitte wechsle den Tab nicht zweimal bei.');
                } else if (axiosError.response?.data?.code === 'SESSION_FULL' || axiosError.response?.status === 409) {
                    setError('Die Session ist voll.');
                } else if (axiosError.response?.status === 401) {
                    setError('Authentifizierung fehlgeschlagen. Bitte melde dich erneut an.');
                } else if (axiosError.response?.data?.code === 'SESSION_NOT_FOUND') {
                    setError('Session mit diesem Code nicht gefunden.');
                } else if (axiosError.response?.status === 404) {
                    setError('Session mit diesem Code nicht gefunden.');
                } else if (axiosError.response?.data?.message) {
                    setError(axiosError.response.data.message);
                } else {
                    setError('Fehler beim Beitritt zur Session. Bitte versuche es später erneut.');
                }

                setLoading(false);
                setTimeout(() => navigate('/lobby'), 3000);
            }
        };

        void joinSessionAsync();
    }, [code, user, navigate, joinSession]);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            backgroundColor: '#1a1a1a',
            color: '#fff'
        }}>
            <div style={{ textAlign: 'center' }}>
                {error ? (
                    <>
                        <h2 style={{ color: '#ff6b6b', marginBottom: '10px' }}>Fehler</h2>
                        <p>{error}</p>
                        <p style={{ marginTop: '20px', fontSize: '12px', color: '#999' }}>
                            Du wirst zurück zur Lobby weitergeleitet...
                        </p>
                    </>
                ) : (
                    <>
                        <h2>Trete Session bei...</h2>
                        <p>Code: {code}</p>
                        {loading && <p style={{ marginTop: '20px', fontSize: '12px', color: '#999' }}>Verbindung wird hergestellt...</p>}
                    </>
                )}
            </div>
        </div>
    );
}

