import useWebSocket from '../hooks/useWebSocket';

export default function WebSocketStatus() {
    const { connected } = useWebSocket();

    return (
        <div>
            <div style={{ color: connected ? 'green' : 'red' }}>
                {connected ? 'Verbunden' : 'Getrennt'}
            </div>
        </div>
    );
}
