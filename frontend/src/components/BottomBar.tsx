import { BOTTOM_BAR_HEIGHT } from '../scenes/GameScreen';

interface BottomBarProps {
    send: (message: object) => void;
    connected: boolean;
}

export default function BottomBar({ send: _send, connected: _connected }: BottomBarProps) {
    return (
        <div style={{
            height: BOTTOM_BAR_HEIGHT,
            flexShrink: 0,
            background: 'linear-gradient(180deg, #0c1b33, #091426)',
        }} />
    );
}