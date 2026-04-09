import { useState } from 'react';
import { BOTTOM_BAR_HEIGHT } from '../App';

interface BottomBarProps {
    send: (message: object) => void;
    connected: boolean;
}

const ship = {
    name: 'Schiff Nr. 1',
    type: 'Anfänger Schiff',
    cargo: '300mile Mexico',
    destination: 'Hamburg',
    progress: 0,
    speed: '16 Knoten',
    tank: 300,
    tankMax: 300,
    durability: 100,
    load: 0,
    loadMax: 2500,
    location: 'Mexico',
};

export default function BottomBar({ send, connected }: BottomBarProps) {
    const [selected, setSelected] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [tickSeconds, setTickSeconds] = useState('1');
    const [speed, setSpeed] = useState('2');

    const handleStartStop = () => {
        send({ type: isRunning ? 'STOP_SESSION' : 'START_SESSION' });
        setIsRunning(r => !r);
    };

    const handleTickBlur = () => {
        const val = parseFloat(tickSeconds);
        if (!isNaN(val) && val > 0) send({ type: 'SET_TICK_RATE', value: val * 1000 });
    };

    const handleSpeedBlur = () => {
        const val = parseFloat(speed);
        if (!isNaN(val) && val > 0) send({ type: 'SET_SPEED', value: val });
    };

    return (
        <div style={{
            height: BOTTOM_BAR_HEIGHT,
            flexShrink: 0,
            background: 'linear-gradient(135deg, #0a1628 0%, #132744 50%, #0d1f3c 100%)',
            borderTop: '1px solid rgba(77, 166, 255, 0.25)',
            color: 'white',
            padding: '12px 20px',
            boxSizing: 'border-box',
            overflowY: 'auto',
            boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(77, 166, 255, 0.1)',
            zIndex: 1,
        }}>
            {!selected ? (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ fontWeight: 'bold', textDecoration: 'underline' }}>Schiff Übersicht</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                            <span style={{
                                width: '8px', height: '8px', borderRadius: '50%',
                                background: connected ? '#4caf50' : '#f44336',
                                display: 'inline-block',
                            }} />
                            {connected ? 'Verbunden' : 'Nicht verbunden'}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}>
                        <div onClick={() => setSelected(true)} style={{ ...cardStyle, width: '200px' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{ship.name}</div>
                            <div>{ship.type}</div>
                            <div>🚢 {ship.cargo}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>-&gt; {ship.destination}</span>
                                <span>{ship.progress}%</span>
                            </div>
                        </div>

                        <div style={{ ...cardStyle, width: '200px', cursor: 'default' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Simulation</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <label style={{ fontSize: '13px', minWidth: '100px' }}>Sekunden</label>
                                <input
                                    type="number" min="0.1" step="0.1"
                                    value={tickSeconds}
                                    onChange={e => setTickSeconds(e.target.value)}
                                    onBlur={handleTickBlur}
                                    style={inputStyle}
                                />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <label style={{ fontSize: '13px', minWidth: '100px' }}>Geschwindigkeit</label>
                                <input
                                    type="number" min="0.1" step="0.5"
                                    value={speed}
                                    onChange={e => setSpeed(e.target.value)}
                                    onBlur={handleSpeedBlur}
                                    style={inputStyle}
                                />
                            </div>
                            <button onClick={handleStartStop} style={{
                                ...backBtnStyle,
                                width: '100%',
                                padding: '6px 0',
                                background: isRunning ? 'rgba(244,67,54,0.2)' : 'rgba(76,175,80,0.2)',
                                borderColor: isRunning ? '#f44336' : '#4caf50',
                                color: isRunning ? '#f44336' : '#4caf50',
                            }}>
                                {isRunning ? '⏹ Stop' : '▶ Start'}
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ fontWeight: 'bold', textDecoration: 'underline' }}>Ausgewähltes Schiff</div>
                        <button onClick={() => setSelected(false)} style={backBtnStyle}>✕ Zurück</button>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <div style={cardStyle}>
                            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{ship.name}</div>
                            <div>{ship.type}</div>
                        </div>
                        <div style={cardStyle}>
                            <StatRow label="Geschwindigkeit" value={ship.speed} />
                            <StatRow label="Tank" value={`${ship.tank}/${ship.tankMax}`} />
                            <ProgressBar value={ship.tank} max={ship.tankMax} />
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ flex: 1 }}>
                                    <StatRow label="Haltbarkeit" value={`${ship.durability}%`} />
                                    <ProgressBar value={ship.durability} max={100} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <StatRow label="Ladung" value={`${ship.load}/${ship.loadMax}t`} />
                                    <ProgressBar value={ship.load} max={ship.loadMax} />
                                </div>
                            </div>
                        </div>
                        <div style={cardStyle}>
                            <div style={{ marginBottom: '6px' }}>Standort</div>
                            <div>Derzeit: {ship.location}</div>
                            <div>Abgeschlossen: {ship.progress}%</div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

function StatRow({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '2px' }}>
            <span>{label}</span>
            <span>{value}</span>
        </div>
    );
}

function ProgressBar({ value, max }: { value: number; max: number }) {
    return (
        <div style={{ background: '#444', borderRadius: '4px', height: '8px', marginBottom: '6px' }}>
            <div style={{
                width: `${(value / max) * 100}%`,
                background: '#4da6ff',
                height: '100%',
                borderRadius: '4px',
            }} />
        </div>
    );
}

const cardStyle: React.CSSProperties = {
    border: '2px solid white',
    borderRadius: '12px',
    padding: '10px 14px',
    cursor: 'pointer',
    background: 'transparent',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
};

const backBtnStyle: React.CSSProperties = {
    background: 'transparent',
    border: '1px solid white',
    borderRadius: '8px',
    padding: '4px 10px',
    cursor: 'pointer',
    fontSize: '13px',
    color: 'white',
};

const inputStyle: React.CSSProperties = {
    width: '70px',
    background: 'transparent',
    color: 'white',
    border: '1px solid white',
    borderRadius: '6px',
    padding: '2px 6px',
    fontSize: '13px',
};
