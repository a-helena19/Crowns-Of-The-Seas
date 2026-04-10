import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSessionContext } from '../context/SessionContext';

export default function JoinSessionPage() {
    const { code } = useParams<{ code: string }>();
    const { user } = useAuth();
    const { joinSession } = useSessionContext();
    const navigate = useNavigate();
    const hasAttemptedJoin = useRef(false);

    useEffect(() => {
        // If not authenticated, redirect to login with return URL
        if (!user) {
            console.log('Not authenticated, redirecting to login');
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
            if (!code) {
                console.log('No code provided');
                navigate('/lobby');
                return;
            }

            try {
                console.log('Attempting to join session with code:', code, 'as user:', user.username);
                const session = await joinSession(code, user.username);

                console.log('Join result:', session);

                if (session) {
                    console.log('Successfully joined, storing data and navigating to /game');
                    // Store session data
                    sessionStorage.setItem('currentSession', JSON.stringify(session));
                    sessionStorage.setItem('userRole', 'guest');
                    sessionStorage.setItem('playerName', user.username);

                    // Redirect to game
                    navigate('/game');
                } else {
                    console.log('Session is null, redirecting to lobby');
                    // Session not found or full, redirect to lobby
                    navigate('/lobby');
                }
            } catch (error) {
                console.error('Error joining session:', error);
                navigate('/lobby');
            }
        };

        joinSessionAsync();
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
                <h2>Trete Session bei...</h2>
                <p>Code: {code}</p>
            </div>
        </div>
    );
}

