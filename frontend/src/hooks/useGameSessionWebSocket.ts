import { useEffect, useRef, useState } from 'react';
import SockJS from 'sockjs-client';
import Stomp, { Client } from 'stompjs';

interface SessionUpdateEvent {
    sessionId: string;
    gameCode: string;
    status: 'LOBBY' | 'FACTION_SELECTION' | 'RUNNING' | 'FINISHED';
    playerCount: number;
    maxPlayers: number;
    players: Array<{
        userId: string;
        playerName: string;
        isHost: boolean;
    }>;
    type: string;
    message?: string;
}

interface PortInfo {
    id: string;
    name: string;
    x: number;
    y: number;
}

interface PortsUpdateEvent {
    eventType: 'PORTS_UPDATE';
    ports: PortInfo[];
}

interface TickUpdateEvent {
    eventType: 'TICK_UPDATE';
    currentTick: number;
    totalTicks: number;
}

export interface ShipPosition {
    playerShipId: string;
    playerId: string;
    playerName: string;
    iconUrl: string;
    x: number;
    y: number;
    status: 'EN_ROUTE' | 'AT_PORT' | 'LOADING' | 'UNLOADING' | 'REFUELING' | 'REPAIRING' | 'READY_TO_DEPART';
    arrivalTick: number | null;
    originX: number | null;
    originY: number | null;
    destX: number | null;
    destY: number | null;
    startTick: number | null;
    paused?: boolean;
}

interface ShipPositionsUpdateEvent {
    eventType: 'SHIP_POSITIONS_UPDATE';
    currentTick: number;
    ships: ShipPosition[];
}

interface CargoRewardBreakdown {
    cargoId: string;
    cargoName: string;
    destinationPort: string;
    baseReward: number;
    actualReward: number;
    percentage: number;
    status: "DELIVERED" | "EXPIRED";
    cargoType: string;
}

interface CustomsSummary {
    outcome: "CLEARED" | "HIDDEN" | "COOPERATED" | "BRIBE_SUCCESS" | "BRIBE_FAILED";
    finePaid: number;
    detained: boolean;
    detentionTicks: number;
    wasCarryingIllegalCargo: boolean;
}

interface TravelCompleteEvent {
    travelId: string;
    playerId: string;
    cargoRewards: CargoRewardBreakdown[];
    baseReward: number;
    totalReward: number;
    previousBalance: number;
    newBalance: number;
    dockingFine?: number;
    departureDockingFine?: number;
    pilotageRefund?: number;
    customsSummary?: CustomsSummary | null;
}

interface RatMinigameEvent {
    eventId: string;
    eventType: "RATS";
    playerId: string;
    sessionId: string;
    travelId: string;
    playerShipId: string;
    timeLimitSeconds: number;
    requiredHits: number;
}

interface UseGameSessionWebSocketProps {
    sessionId: string | null;
    onSessionUpdate: (event: SessionUpdateEvent) => void;
    onTickUpdate?: (event: TickUpdateEvent) => void;
}
export function useGameSessionWebSocket({
                                            sessionId,
                                            onSessionUpdate,
                                            onTickUpdate
                                        }: UseGameSessionWebSocketProps) {
    const stompClientRef = useRef<Client | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [stompClient, setStompClient] = useState<Client | null>(null);
    const connectAttemptedRef = useRef(false);
    const lastTickSignatureRef = useRef<string | null>(null);
    const lastShipsSignatureRef = useRef<string | null>(null);
    const lastTickNumberRef = useRef<number | null>(null);
    const lastTickAtMsRef = useRef<number | null>(null);
    const smoothedTickMsRef = useRef<number | null>(null);
    const onSessionUpdateRef = useRef(onSessionUpdate);
    useEffect(() => {
        onSessionUpdateRef.current = onSessionUpdate;
    }, [onSessionUpdate]);

    useEffect(() => {
        if (!sessionId) return;
        if (connectAttemptedRef.current) return;

        const timer = setTimeout(() => {
            connectAttemptedRef.current = true;

            try {
                const wsUrl = window.location.hostname === 'localhost'
                    ? 'http://localhost:8080/ws'
                    : `/ws`;

                console.log('Connecting to WebSocket:', wsUrl);
                const socket = new SockJS(wsUrl);
                const client = Stomp.over(socket);

                client.connect(
                    {},
                    () => {
                        console.log('WebSocket connected');
                        setIsConnected(true);
                        stompClientRef.current = client;
                        setStompClient(client);

                        client.subscribe(`/topic/session/${sessionId}`, (message) => {
                            console.log('Received session update:', message.body);
                            try {
                                const event = JSON.parse(message.body) as SessionUpdateEvent;
                                console.log('Event type:', event.type);
                                onSessionUpdateRef.current(event);
                            } catch (error) {
                                console.error('Error parsing session update:', error);
                            }
                        });

                        client.subscribe(`/topic/session/${sessionId}/ports`, (message) => {
                            console.log('Received ports update:', message.body);
                            try {
                                const event = JSON.parse(message.body) as PortsUpdateEvent;
                                window.__latestPorts = event.ports;
                                window.dispatchEvent(new CustomEvent('backend-ports', { detail: event.ports }));
                            } catch (error) {
                                console.error('Error parsing ports update:', error);
                            }
                        });

                        client.subscribe(`/topic/session/${sessionId}/tick`, (message) => {
                            try {
                                const event = JSON.parse(message.body) as TickUpdateEvent;
                                const tickSignature = `${event.currentTick}:${event.totalTicks}`;
                                if (lastTickSignatureRef.current === tickSignature) return;
                                lastTickSignatureRef.current = tickSignature;

                                const nowMs = performance.now();
                                const prevTick = lastTickNumberRef.current;
                                const prevAtMs = lastTickAtMsRef.current;
                                if (prevTick != null && prevAtMs != null && event.currentTick > prevTick) {
                                    const tickDiff = event.currentTick - prevTick;
                                    const elapsedMs = nowMs - prevAtMs;
                                    const measuredTickMs = elapsedMs / tickDiff;
                                    if (Number.isFinite(measuredTickMs) && measuredTickMs >= 50 && measuredTickMs <= 120_000) {
                                        const previous = smoothedTickMsRef.current ?? measuredTickMs;
                                        const next = previous * 0.75 + measuredTickMs * 0.25;
                                        smoothedTickMsRef.current = next;
                                        window.__tickRateMs = next;
                                    }
                                }
                                lastTickNumberRef.current = event.currentTick;
                                lastTickAtMsRef.current = nowMs;

                                window.__latestTick = event;
                                window.dispatchEvent(new CustomEvent('backend-tick', { detail: event }));
                                if (onTickUpdate) onTickUpdate(event);
                            } catch (error) {
                                console.error('Error parsing tick update:', error);
                            }
                        });

                        client.subscribe(`/topic/session/${sessionId}/ships`, (message) => {
                            try {
                                const event = JSON.parse(message.body) as ShipPositionsUpdateEvent;
                                const shipsSignature = `${event.currentTick}:${JSON.stringify(event.ships)}`;
                                if (lastShipsSignatureRef.current === shipsSignature) return;
                                lastShipsSignatureRef.current = shipsSignature;
                                window.__latestShips = event.ships;
                                window.__latestShipPositionsTick = event.currentTick;
                                window.dispatchEvent(new CustomEvent('backend-ship-positions', { detail: event }));
                            } catch (error) {
                                console.error('Error parsing ship positions:', error);
                            }
                        });

                        client.subscribe(`/topic/session/${sessionId}/travel-complete`, (message) => {
                            try {
                                const event = JSON.parse(message.body) as TravelCompleteEvent;
                                window.dispatchEvent(new CustomEvent('travel-complete', { detail: event }));
                                window.dispatchEvent(new Event('player-balance-updated'));
                            } catch (error) {
                                console.error('Error parsing travel-complete event:', error);
                            }
                        });

                        client.subscribe(`/topic/session/${sessionId}/smuggle-offer`, (message) => {
                            try {
                                const event = JSON.parse(message.body);
                                window.dispatchEvent(new CustomEvent('smuggle-offer', { detail: event }));
                            } catch (error) {
                                console.error('Error parsing smuggle-offer event:', error);
                            }
                        });

                        client.subscribe(`/topic/session/${sessionId}/travel-resumed`, (message) => {
                            try {
                                const event = JSON.parse(message.body);
                                window.dispatchEvent(new CustomEvent('travel-resumed', { detail: event }));
                            } catch (error) {
                                console.error('Error parsing travel-resumed event:', error);
                            }
                        });

                        client.subscribe(`/topic/session/${sessionId}/pilot-strike`, (message) => {
                            try {
                                const event = JSON.parse(message.body);
                                window.dispatchEvent(new CustomEvent('pilot-strike-update', { detail: event }));
                            } catch (error) {
                                console.error('Error parsing pilot-strike event:', error);
                            }
                        });

                        client.subscribe(`/topic/session/${sessionId}/rats-event`, (message) => {
                            try {
                                const event = JSON.parse(message.body) as RatMinigameEvent;
                                window.dispatchEvent(new CustomEvent('rats-event', { detail: event }));
                            } catch (error) {
                                console.error('Error parsing rats-event:', error);
                            }
                        });

                        client.subscribe(`/topic/session/${sessionId}/customs-inspection`, (message) => {
                            try {
                                const event = JSON.parse(message.body);
                                window.dispatchEvent(new CustomEvent('customs-inspection', { detail: event }));
                            } catch (error) {
                                console.error('Error parsing customs-inspection event:', error);
                            }
                        });

                        client.subscribe(`/topic/session/${sessionId}/customs-pass`, (message) => {
                            try {
                                const event = JSON.parse(message.body);
                                window.dispatchEvent(new CustomEvent('customs-pass', { detail: event }));
                            } catch (error) {
                                console.error('Error parsing customs-pass event:', error);
                            }
                        });

                        client.subscribe(`/topic/session/${sessionId}/customs-resolved`, (message) => {
                            try {
                                const event = JSON.parse(message.body);
                                window.dispatchEvent(new CustomEvent('customs-resolved', { detail: event }));
                            } catch (error) {
                                console.error('Error parsing customs-resolved event:', error);
                            }
                        });

                        client.send(`/app/session/${sessionId}/subscribe`, {});
                    },
                    (error) => {
                        console.error('WebSocket connection error:', error);
                        setIsConnected(false);
                        connectAttemptedRef.current = false;
                    }
                );
            } catch (error) {
                console.error('Failed to connect to WebSocket:', error);
                setIsConnected(false);
                connectAttemptedRef.current = false;
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [sessionId]);

    useEffect(() => {
        return () => {
            if (stompClientRef.current) {
                stompClientRef.current.disconnect(() => {
                    console.log('WebSocket disconnected');
                });
                stompClientRef.current = null;
                setStompClient(null);
                setIsConnected(false);
                connectAttemptedRef.current = false;
                lastTickSignatureRef.current = null;
                lastShipsSignatureRef.current = null;
                lastTickNumberRef.current = null;
                lastTickAtMsRef.current = null;
                smoothedTickMsRef.current = null;
            }
        };
    }, []);

    return {
        isConnected,
        disconnect: () => {
            if (stompClientRef.current) {
                stompClientRef.current.disconnect(() => {
                    console.log('WebSocket disconnected');
                    setIsConnected(false);
                    setStompClient(null);
                    connectAttemptedRef.current = false;
                    lastTickSignatureRef.current = null;
                    lastShipsSignatureRef.current = null;
                    lastTickNumberRef.current = null;
                    lastTickAtMsRef.current = null;
                    smoothedTickMsRef.current = null;
                    stompClientRef.current = null;
                });
            }
        },
        stompClient
    };
}