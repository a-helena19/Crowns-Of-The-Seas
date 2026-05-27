export type MinigameSessionOutcome = "COMPLETED" | "DECLINED";

export interface MinigameSessionStartInput {
    minigameType: string;
    eventId: string;
    playerId: string;
    playerShipId: string;
    travelId: string;
}

export interface ActiveMinigameSession {
    minigameType: string;
    eventId: string;
    playerId: string;
    playerShipId: string;
    travelId: string;
    startedAtMs: number;
}

export interface ShipMinigameBlockChangedEvent {
    type: "ship-block-changed";
    shipId: string;
    blocked: boolean;
    session?: ActiveMinigameSession;
    outcome?: MinigameSessionOutcome;
}

type Listener = (event: ShipMinigameBlockChangedEvent) => void;

class MinigameSessionManager {
    private activeByEventId: Map<string, ActiveMinigameSession> = new Map();
    private activeByShipId: Map<string, ActiveMinigameSession> = new Map();
    private listeners: Set<Listener> = new Set();

    startSession(input: MinigameSessionStartInput): ActiveMinigameSession {
        const existing = this.activeByEventId.get(input.eventId);
        if (existing) return existing;

        const session: ActiveMinigameSession = {
            ...input,
            startedAtMs: Date.now(),
        };

        this.activeByEventId.set(input.eventId, session);
        this.activeByShipId.set(input.playerShipId, session);
        this.emit({
            type: "ship-block-changed",
            shipId: input.playerShipId,
            blocked: true,
            session,
        });
        return session;
    }

    finishSession(eventId: string, outcome: MinigameSessionOutcome): ActiveMinigameSession | null {
        const session = this.activeByEventId.get(eventId);
        if (!session) return null;

        this.activeByEventId.delete(eventId);
        const currentForShip = this.activeByShipId.get(session.playerShipId);
        if (currentForShip?.eventId === eventId) {
            this.activeByShipId.delete(session.playerShipId);
            this.emit({
                type: "ship-block-changed",
                shipId: session.playerShipId,
                blocked: false,
                session,
                outcome,
            });
        }
        return session;
    }

    isShipBlocked(shipId: string): boolean {
        return this.activeByShipId.has(shipId);
    }

    getSessionForShip(shipId: string): ActiveMinigameSession | undefined {
        return this.activeByShipId.get(shipId);
    }

    getAllBlockedShips(): Map<string, ActiveMinigameSession> {
        return new Map(this.activeByShipId);
    }

    subscribe(listener: Listener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private emit(event: ShipMinigameBlockChangedEvent) {
        for (const listener of this.listeners) {
            listener(event);
        }
    }
}

export const minigameSessionManager = new MinigameSessionManager();

