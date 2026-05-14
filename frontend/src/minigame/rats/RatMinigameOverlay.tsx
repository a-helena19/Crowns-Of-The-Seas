import { useEffect, useRef } from "react";
import { RatMinigameManager } from "./RatMinigameManager";
import type { RatMinigameConfig, RatMinigameResult } from "./RatMinigameTypes";

interface Props {
    config: RatMinigameConfig;
    onFinished: (result: RatMinigameResult) => void;
}

export default function RatMinigameOverlay({ config, onFinished }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const managerRef = useRef<RatMinigameManager | null>(null);
    const configRef = useRef(config);
    const onFinishedRef = useRef(onFinished);

    useEffect(() => {
        configRef.current = config;
    }, [config]);

    useEffect(() => {
        onFinishedRef.current = onFinished;
    }, [onFinished]);

    useEffect(() => {
        if (!containerRef.current) return;

        const manager = new RatMinigameManager();
        manager.mount(containerRef.current, configRef.current, (result) => onFinishedRef.current(result));
        managerRef.current = manager;

        return () => manager.destroy();
    }, []);

    return (
        <div style={{
            position: "fixed",
            inset: 0,
            zIndex: 1600,
            background: "rgba(0, 0, 0, 0.75)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "16px",
        }}>
            <div ref={containerRef} style={{ width: "min(1000px, 95vw)", height: "min(700px, 88vh)", border: "2px solid #f4e8c1" }} />
        </div>
    );
}
