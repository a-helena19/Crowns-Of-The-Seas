import { useEffect, useState } from "react";

export function useSpriteAnimation(frames: string[], speed = 5000) {
    const [frame, setFrame] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setFrame(f => (f + 1) % frames.length);
        }, speed);

        return () => clearInterval(interval);
    }, [frames.length, speed]);

    return frames[frame];
}