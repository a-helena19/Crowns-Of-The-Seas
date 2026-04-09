import { TOP_BAR_HEIGHT } from '../App';

export default function TopBar() {
    return (
        <div style={{
            height: TOP_BAR_HEIGHT,
            flexShrink: 0,
            background: 'linear-gradient(135deg, #0a1628 0%, #132744 50%, #0d1f3c 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px 4px rgba(0,0,0,0.6)',
            zIndex: 1,
        }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <span>💵 25.000</span>
                <span>🚢 1 Schiff</span>
                <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>⏱ 00:00 - 1/1/2026</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button style={{ ...btnStyle, fontSize: '18px', padding: '6px 10px' }}>⚙️</button>
            </div>
        </div>
    );
}

const btnStyle: React.CSSProperties = {
    background: 'transparent',
    border: '1px solid white',
    borderRadius: '20px',
    padding: '6px 18px',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: 500,
};
