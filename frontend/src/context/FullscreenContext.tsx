import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { PropsWithChildren } from "react";
import { createPortal } from "react-dom";

type FullscreenPromptKind = "enter" | "exit";

interface FullscreenPromptConfig {
    kind: FullscreenPromptKind;
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel: string;
}

interface FullscreenContextValue {
    isSupported: boolean;
    isFullscreen: boolean;
    requestRecommendedFullscreen: () => Promise<boolean>;
    confirmExitFullscreen: () => Promise<boolean>;
    enterFullscreen: () => Promise<boolean>;
    exitFullscreen: () => Promise<boolean>;
    registerFullscreenTarget: (element: HTMLElement | null) => void;
}

const FullscreenContext = createContext<FullscreenContextValue | null>(null);

function isFullscreenSupported() {
    return typeof document !== "undefined" && !!document.fullscreenEnabled;
}

export function FullscreenProvider({ children }: PropsWithChildren) {
    const [isFullscreen, setIsFullscreen] = useState(() => typeof document !== "undefined" && !!document.fullscreenElement);
    const [promptConfig, setPromptConfig] = useState<FullscreenPromptConfig | null>(null);
    const resolverRef = useRef<((value: boolean) => void) | null>(null);
    const fullscreenTargetRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
    }, []);

    useEffect(() => () => {
        resolverRef.current?.(false);
        resolverRef.current = null;
    }, []);

    const registerFullscreenTarget = useCallback((element: HTMLElement | null) => {
        fullscreenTargetRef.current = element;
    }, []);

    const openPrompt = useCallback((config: FullscreenPromptConfig) => new Promise<boolean>((resolve) => {
        resolverRef.current = resolve;
        setPromptConfig(config);
    }), []);

    const closePrompt = useCallback((accepted: boolean) => {
        resolverRef.current?.(accepted);
        resolverRef.current = null;
        setPromptConfig(null);
    }, []);

    const enterFullscreen = useCallback(async () => {
        if (!isFullscreenSupported()) {
            return false;
        }

        if (document.fullscreenElement) {
            setIsFullscreen(true);
            return true;
        }

        const target = fullscreenTargetRef.current ?? document.documentElement;

        try {
            await target.requestFullscreen();
            setIsFullscreen(true);
            return true;
        } catch (error) {
            console.warn("Vollbild konnte nicht aktiviert werden:", error);
            return false;
        }
    }, []);

    const exitFullscreen = useCallback(async () => {
        if (!document.fullscreenElement) {
            setIsFullscreen(false);
            return true;
        }

        try {
            await document.exitFullscreen();
            setIsFullscreen(false);
            return true;
        } catch (error) {
            console.warn("Vollbild konnte nicht beendet werden:", error);
            return false;
        }
    }, []);

    const requestRecommendedFullscreen = useCallback(async () => {
        if (!isFullscreenSupported()) {
            return false;
        }

        return openPrompt({
            kind: "enter",
            title: "Vollbild verwenden?",
            message: "Wir empfehlen den Vollbildmodus für das beste Spielerlebnis.",
            confirmLabel: "Ja, Vollbild nutzen",
            cancelLabel: "Nein",
        });
    }, [openPrompt]);

    const confirmExitFullscreen = useCallback(async () => {
        if (!isFullscreenSupported() || (!document.fullscreenElement && !isFullscreen)) {
            return false;
        }

        return openPrompt({
            kind: "exit",
            title: "Vollbild beenden?",
            message: "Möchtest du den Vollbildmodus verlassen?",
            confirmLabel: "Ja, Vollbild beenden",
            cancelLabel: "Im Vollbild bleiben",
        });
    }, [isFullscreen, openPrompt]);

    const handleConfirm = async () => {
        if (!promptConfig) {
            return;
        }

        if (promptConfig.kind === "exit") {
            const resolve = resolverRef.current;
            resolverRef.current = null;
            setPromptConfig(null);
            const success = await exitFullscreen();
            resolve?.(success);
            return;
        }

        const success = await enterFullscreen();
        closePrompt(success);
    };

    const handleCancel = async () => {
        if (promptConfig?.kind === "exit" && !document.fullscreenElement) {
            await enterFullscreen();
        }
        closePrompt(false);
    };

    const portalTarget = document.fullscreenElement ?? document.body;

    return (
        <FullscreenContext.Provider
            value={{
                isSupported: isFullscreenSupported(),
                isFullscreen,
                requestRecommendedFullscreen,
                confirmExitFullscreen,
                enterFullscreen,
                exitFullscreen,
                registerFullscreenTarget,
            }}
        >
            {children}
            {promptConfig && createPortal(
                <div className="fullscreen-dialog-backdrop" role="dialog" aria-modal="true" aria-label={promptConfig.title}>
                    <div className="fullscreen-dialog">
                        <div className="fullscreen-dialog-kicker">Anzeige</div>
                        <h2>{promptConfig.title}</h2>
                        <p>{promptConfig.message}</p>
                        <div className="fullscreen-dialog-actions">
                            <button type="button" className="fullscreen-dialog-btn secondary" onClick={handleCancel}>
                                {promptConfig.cancelLabel}
                            </button>
                            <button type="button" className="fullscreen-dialog-btn primary" onClick={handleConfirm}>
                                {promptConfig.confirmLabel}
                            </button>
                        </div>
                    </div>
                </div>,
                portalTarget
            )}
        </FullscreenContext.Provider>
    );
}

export function useFullscreen() {
    const context = useContext(FullscreenContext);
    if (!context) {
        throw new Error("useFullscreen must be used within a FullscreenProvider");
    }
    return context;
}
