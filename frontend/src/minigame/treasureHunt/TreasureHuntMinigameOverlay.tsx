import { useEffect, useRef } from "react";
import { TreasureHuntMinigameManager } from "./TreasureHuntMinigameManager";
import type { TreasureHuntMinigameConfig, TreasureHuntMinigameResult } from "./TreasureHuntMinigameTypes";

interface Props {
    config: TreasureHuntMinigameConfig;
    onFinished: (result: TreasureHuntMinigameResult) => void;
}

export default function TreasureHuntMinigameOverlay({ config, onFinished }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const managerRef = useRef<TreasureHuntMinigameManager | null>(null);
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

        const manager = new TreasureHuntMinigameManager();
        manager.mount(containerRef.current, configRef.current, (result) => onFinishedRef.current(result));
        managerRef.current = manager;

        return () => manager.destroy();
    }, []);

    return (
        <div style={{
            position: "fixed",
            inset: 0,
            zIndex: 1600,
            background: "rgba(0, 0, 0, 0.78)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "16px",
        }}>
            <div ref={containerRef} style={{ width: "min(1040px, 95vw)", height: "min(720px, 88vh)", border: "2px solid #f4e8c1" }} />
        </div>
    );
}
