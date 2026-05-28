import { useEffect, useRef } from "react";
import { ObstacleMinigameManager } from "./ObstacleMinigameManager";
import type { ObstacleMinigameConfig, ObstacleMinigameResult } from "./ObstacleMinigameTypes";

interface Props {
    config: ObstacleMinigameConfig;
    onFinished: (result: ObstacleMinigameResult) => void;
}

export default function ObstacleMinigameOverlay({ config, onFinished }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const managerRef = useRef<ObstacleMinigameManager | null>(null);
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
        const manager = new ObstacleMinigameManager();
        manager.mount(containerRef.current, configRef.current, (result) => onFinishedRef.current(result));
        managerRef.current = manager;
        return () => manager.destroy();
    }, []);

    return (
        <div style={{
            position: "fixed",
            inset: 0,
            zIndex: 1600,
            background: "rgba(0, 0, 0, 0.76)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "16px",
        }}>
            <div
                ref={containerRef}
                style={{
                    width: "min(1040px, 95vw)",
                    height: "min(700px, 88vh)",
                    border: "2px solid #9ed8ee",
                    background: "#06364d",
                }}
            />
        </div>
    );
}
