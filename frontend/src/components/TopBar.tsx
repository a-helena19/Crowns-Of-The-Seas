import { TOP_BAR_HEIGHT } from '../scenes/GameScreen';
import { useEffect, useRef, useState } from 'react';
import '../style/topbar.css';
import moneyIcon from "../assets/icon-money.png";
import timeIcon from "../assets/icon-clock.png";
import shipIcon from "../assets/icon-ship.png";
import { FACTION_DATA } from '../types/faction';
import type { PlayerFaction } from '../types/faction';
import { sessionApi } from '../api/sessionApi';


export default function TopBar() {
    const [balance, setBalance] = useState<number | null>(null);
    const [shipCount, setShipCount] = useState<number | null>(null);
    const [currentTick, setCurrentTick] = useState<number | null>(null);
    const [totalTicks, setTotalTicks] = useState<number | null>(null);
    const [faction, setFaction] = useState<PlayerFaction | null>(null);
    const [factionPanelOpen, setFactionPanelOpen] = useState(false);
    const [homePortName, setHomePortName] = useState<string | null>(null);

    const factionWrapperRef = useRef<HTMLDivElement | null>(null);

    const userData = localStorage.getItem('crowns_user');
    const playerId = userData ? JSON.parse(userData).id : null;
    const token = localStorage.getItem('auth_token') ?? '';
    const sessionData = sessionStorage.getItem('currentSession');
    const sessionId = sessionData ? JSON.parse(sessionData).id : null;

    useEffect(() => {
        if (!playerId || !sessionId) return;

        const fetchPlayerData = () => {
            fetch(`/api/ships/player/${playerId}/balance?sessionId=${sessionId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => setBalance(Number(data)))
                .catch(() => setBalance(null));

            fetch(`/api/ships/player/${playerId}?sessionId=${sessionId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => setShipCount(data.length))
                .catch(() => setShipCount(null));
        };

        fetchPlayerData();

        window.addEventListener('player-balance-updated', fetchPlayerData);
        return () => window.removeEventListener('player-balance-updated', fetchPlayerData);
    }, [playerId, sessionId, token]);

    useEffect(() => {
        if (window.__latestTick) {
            setCurrentTick(window.__latestTick.currentTick);
            setTotalTicks(window.__latestTick.totalTicks);
        }

        const handleTick = (e: Event) => {
            const { currentTick, totalTicks } = (e as CustomEvent).detail;
            setCurrentTick(currentTick);
            setTotalTicks(totalTicks);
        };

        window.addEventListener('backend-tick', handleTick);
        return () => window.removeEventListener('backend-tick', handleTick);
    }, []);

    // Faction des Spielers laden (einmalig beim Mount)
    useEffect(() => {
        if (!playerId || !sessionId) return;
        sessionApi.getPlayerFaction(sessionId, playerId)
            .then(result => {
                if (result?.faction) {
                    setFaction(result.faction as PlayerFaction);
                }
            })
            .catch(err => console.warn('Could not load player faction:', err));
    }, [playerId, sessionId]);

    // Heimathafen laden
    useEffect(() => {
        if (!playerId || !sessionId) return;
        sessionApi.getHomePort(sessionId, playerId)
            .then(result => {
                if (result?.homePortId) {
                    window.__homePortId = result.homePortId;
                    const portName = window.__latestPorts?.find(p => p.id === result.homePortId)?.name;
                    setHomePortName(portName ?? null);
                }
            })
            .catch(err => console.warn('Could not load home port:', err));
    }, [playerId, sessionId]);

    // Port-Name aktualisieren sobald Ports geladen sind
    useEffect(() => {
        if (!window.__homePortId) return;
        const portName = window.__latestPorts?.find(p => p.id === window.__homePortId)?.name;
        if (portName) setHomePortName(portName);
    }, [window.__latestPorts]);

    // Klick außerhalb schließt das Panel
    useEffect(() => {
        if (!factionPanelOpen) return;
        const handler = (e: MouseEvent) => {
            if (factionWrapperRef.current && !factionWrapperRef.current.contains(e.target as Node)) {
                setFactionPanelOpen(false);
            }
        };
        // Mit kleinem Delay registrieren, damit der gleiche Klick nicht direkt schließt
        const t = setTimeout(() => document.addEventListener('mousedown', handler), 0);
        return () => {
            clearTimeout(t);
            document.removeEventListener('mousedown', handler);
        };
    }, [factionPanelOpen]);

    const factionData = faction ? FACTION_DATA[faction] : null;

    return (
        <div className="topbar-container" style={{ height: TOP_BAR_HEIGHT }}>
            <div className="topbar-left">
                <div className="topbar-panel">
                    <img src={moneyIcon} alt="" className="topbar-icon" />
                    <span className="topbar-value">
                        {balance !== null ? balance.toLocaleString('de') : '...'} T
                    </span>
                </div>
                <div className="topbar-panel">
                    <img src={shipIcon} alt="" className="topbar-icon" />
                    <span className="topbar-value">
                        {shipCount !== null ? `${shipCount} Schiffe` : '...'}
                    </span>
                </div>
            </div>

            <div className="topbar-center">
                <div className="topbar-panel">
                    <img src={timeIcon} alt="" className="topbar-icon" />
                    <span className="topbar-value">
                        Tag {currentTick !== null ? currentTick : '1'}
                        {totalTicks !== null && (
                            <span className="topbar-total"> / {totalTicks}</span>
                        )}
                    </span>
                </div>
            </div>

            <div className="topbar-right">
                {homePortName && (
                    <div className="topbar-panel topbar-homeport">
                        <span className="topbar-homeport-icon">⚓</span>
                        <span className="topbar-value">{homePortName}</span>
                    </div>
                )}
                {factionData && (
                    <div className="topbar-faction-wrapper" ref={factionWrapperRef}>
                        <button
                            type="button"
                            className={`topbar-panel topbar-faction-btn ${factionPanelOpen ? 'is-open' : ''}`}
                            onClick={() => setFactionPanelOpen(o => !o)}
                            aria-expanded={factionPanelOpen}
                            aria-haspopup="dialog"
                            title={`Fraktion: ${factionData.name}`}
                        >
                            <div className="topbar-faction-icon">
                                <img
                                    src={factionData.icon1}
                                    alt={factionData.name}
                                    className="topbar-faction-icon-img"
                                />
                            </div>
                            <span className="topbar-value topbar-faction-name">
                                {factionData.name}
                            </span>
                        </button>

                        {factionPanelOpen && (
                            <div
                                className="faction-popover"
                                role="dialog"
                                aria-label={`Beschreibung Fraktion ${factionData.name}`}
                            >
                                <div
                                    className="faction-popover-accent"
                                    style={{ background: factionData.color }}
                                />
                                <div className="faction-popover-header">
                                    <div className="faction-popover-icon">
                                        <img
                                            src={factionData.icon1}
                                            alt=""
                                            className="faction-popover-icon-img frame1"
                                        />

                                        <img
                                            src={factionData.icon2}
                                            alt=""
                                            className="faction-popover-icon-img frame2"
                                        />
                                    </div>
                                    <div className="faction-popover-titles">
                                        <h3 className="faction-popover-name">
                                            {factionData.name}
                                        </h3>
                                        <span className="faction-popover-label">
                                            DEINE FRAKTION
                                        </span>
                                    </div>
                                </div>
                                <p className="faction-popover-desc">
                                    {factionData.description}
                                </p>
                                <ul className="faction-popover-pros">
                                    {factionData.pros.map((p, i) => <li key={i}>{p}</li>)}
                                </ul>
                                <ul className="faction-popover-cons">
                                    {factionData.cons.map((c, i) => <li key={i}>{c}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}