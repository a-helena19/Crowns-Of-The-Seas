import { useEffect, useRef } from "react";
import { StormMinigameManager } from "./StormMinigameManager";
import type { StormMinigameConfig, StormMinigameResult } from "./StormMinigameTypes";

interface Props {
    config: StormMinigameConfig;
    onFinished: (result: StormMinigameResult) => void;
}

export default function StormMinigameOverlay({ config, onFinished }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const managerRef = useRef<StormMinigameManager | null>(null);
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
        const manager = new StormMinigameManager();
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
            <div ref={containerRef} style={{ width: "min(1000px, 95vw)", height: "min(700px, 88vh)", border: "2px solid #b7d0ef" }} />
        </div>
    );
}

