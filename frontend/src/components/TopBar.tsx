import { TOP_BAR_HEIGHT } from '../scenes/GameScreen';
import { useEffect, useMemo, useRef, useState } from 'react';
import '../style/topbar.css';
import moneyIcon from "../assets/icon-money.png";
import timeIcon from "../assets/icon-clock.png";
import shipIcon from "../assets/icon-ship.png";
import { FACTION_DATA } from '../types/faction';
import type { PlayerFaction } from '../types/faction';
import { sessionApi } from '../api/sessionApi';
import { getLeaderboard } from '../api/leaderboardApi';
import type { LeaderboardEntry } from '../types/leaderboard';
import { useAudioSettings } from '../audio/AudioSettingsContext';
import audioEngine from '../audio/AudioEngine';
import { useNavigate } from 'react-router-dom';
import HelpCenter from './HelpCenter';


export default function TopBar() {
    const navigate = useNavigate();
    const [balance, setBalance] = useState<number | null>(null);
    const [shipCount, setShipCount] = useState<number | null>(null);
    const [currentTick, setCurrentTick] = useState<number | null>(null);
    const [totalTicks, setTotalTicks] = useState<number | null>(null);
    const [faction, setFaction] = useState<PlayerFaction | null>(null);
    const [factionPanelOpen, setFactionPanelOpen] = useState(false);
    const [homePortName, setHomePortName] = useState<string | null>(null);
    const [endingToastShown, setEndingToastShown] = useState(false);
    const [showEndingToast, setShowEndingToast] = useState(false);
    const [endingToastHiding, setEndingToastHiding] = useState(false);
    const { settings, setMusicEnabled, setSfxEnabled, setMusicVolume, setSfxVolume } = useAudioSettings();
    const [audioMenuOpen, setAudioMenuOpen] = useState(false);
    const [helpOpen, setHelpOpen] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const audioMenuRef = useRef<HTMLDivElement | null>(null);

    const factionWrapperRef = useRef<HTMLDivElement | null>(null);

    const userData = localStorage.getItem('crowns_user');
    const playerId = userData ? JSON.parse(userData).id : null;
    const token = localStorage.getItem('auth_token') ?? '';
    const sessionData = sessionStorage.getItem('currentSession');
    const sessionId = sessionData ? JSON.parse(sessionData).id : null;

    // Session aktiv verlassen: Backend benachrichtigen (entfernt Spieler, weist
    // ggf. neuen Host zu, beendet leere Session), danach Musik stoppen und in die
    // Lobby navigieren. Der GameScreen wird dadurch ausgehängt, wodurch der
    // WebSocket-Hook die Verbindung trennt – es kommen keine Session-Events mehr an.
    const handleLeaveSession = async () => {
        if (leaving) return;
        setLeaving(true);
        audioEngine.playSfx('buttonClick');
        try {
            if (sessionId) {
                await sessionApi.leaveSession(sessionId);
            }
        } catch (err) {
            // Auch bei einem Fehler navigieren wir, damit der Spieler nicht festhängt.
            console.warn('Konnte Session nicht sauber verlassen:', err);
        } finally {
            audioEngine.stopMusic();
            sessionStorage.removeItem('currentSession');
            navigate('/lobby');
        }
    };

    // leaderboard
    const [lbOpen, setLbOpen] = useState(false);
    const [lbEntries, setLbEntries] = useState<LeaderboardEntry[]>([]);
    const lbWrapperRef = useRef<HTMLDivElement | null>(null);

    const sortedLb = useMemo(() => lbEntries, [lbEntries]);

    useEffect(() => {
        if (!sessionId) return;
        const load = async () => {
            try {
                const data = await getLeaderboard(sessionId);
                setLbEntries(data);
            } catch { /* ignore */ }
        };
        load();
        const id = window.setInterval(load, 5000);
        window.addEventListener('player-balance-updated', load);
        return () => {
            window.clearInterval(id);
            window.removeEventListener('player-balance-updated', load);
        };
    }, [sessionId]);

    useEffect(() => {
        if (!lbOpen) return;
        const handler = (e: MouseEvent) => {
            if (lbWrapperRef.current && !lbWrapperRef.current.contains(e.target as Node)) {
                setLbOpen(false);
            }
        };
        const t = setTimeout(() => document.addEventListener('mousedown', handler), 0);
        return () => {
            clearTimeout(t);
            document.removeEventListener('mousedown', handler);
        };
    }, [lbOpen]);

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

        const applyDirectBalance = (e: Event) => {
            const detail = (e as CustomEvent<{ balance?: number }>).detail;
            if (detail && typeof detail.balance === 'number') {
                setBalance(detail.balance);
            }
        };

        window.addEventListener('player-balance-updated', fetchPlayerData);
        window.addEventListener('player-balance-set', applyDirectBalance);
        return () => {
            window.removeEventListener('player-balance-updated', fetchPlayerData);
            window.removeEventListener('player-balance-set', applyDirectBalance);
        };
    }, [playerId, sessionId, token]);

    useEffect(() => {
        if (!audioMenuOpen) return;
        const handler = (e: MouseEvent) => {
            if (audioMenuRef.current && !audioMenuRef.current.contains(e.target as Node)) {
                setAudioMenuOpen(false);
            }
        };
        const t = setTimeout(() => document.addEventListener('mousedown', handler), 0);
        return () => {
            clearTimeout(t);
            document.removeEventListener('mousedown', handler);
        };
    }, [audioMenuOpen]);

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

    // ── Spielende-Warnung berechnen ──
    const ticksRemaining = (currentTick !== null && totalTicks !== null)
        ? totalTicks - currentTick
        : null;

    const endingLevel: 'none' | 'warning' | 'critical' =
        (ticksRemaining !== null && totalTicks !== null && totalTicks > 0)
            ? ticksRemaining <= Math.ceil(totalTicks * 0.05) ? 'critical'
                : ticksRemaining <= Math.ceil(totalTicks * 0.10) ? 'warning'
                    : 'none'
            : 'none';

    // ── Toast einmalig anzeigen wenn Warnstufe erreicht ──
    useEffect(() => {
        if (endingLevel !== 'none' && !endingToastShown) {
            setEndingToastShown(true);
            setShowEndingToast(true);

            // Auto-hide nach 5 Sekunden
            const timer = setTimeout(() => {
                setEndingToastHiding(true);
                setTimeout(() => {
                    setShowEndingToast(false);
                    setEndingToastHiding(false);
                }, 400);
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [endingLevel, endingToastShown]);

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
                <div className={`topbar-panel ${
                    endingLevel === 'critical' ? 'ending-critical' :
                        endingLevel === 'warning' ? 'ending-warning' : ''
                }`}>
                    <img src={timeIcon} alt="" className="topbar-icon" />
                    <span className="topbar-value">
                        {endingLevel !== 'none' && ticksRemaining !== null ? (
                            <>
                                ⚠ Noch {ticksRemaining} {ticksRemaining === 1 ? 'Tag' : 'Tage'}!
                            </>
                        ) : (
                            <>
                                Tag {currentTick !== null ? currentTick : '1'}
                                {totalTicks !== null && (
                                    <span className="topbar-total"> / {totalTicks}</span>
                                )}
                            </>
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
                            onClick={() => {audioEngine.playSfx('buttonClick'); setFactionPanelOpen(o => !o); }}
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
                                        <img src={factionData.icon1} alt="" className="faction-popover-icon-img frame1" />
                                        <img src={factionData.icon2} alt="" className="faction-popover-icon-img frame2" />
                                    </div>
                                    <div className="faction-popover-titles">
                                        <h3 className="faction-popover-name">{factionData.name}</h3>
                                        <span className="faction-popover-label">DEINE FRAKTION</span>
                                    </div>
                                </div>
                                <p className="faction-popover-desc">{factionData.description}</p>
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

                <div className="topbar-lb-wrapper" ref={lbWrapperRef}>
                    <button
                        type="button"
                        className={`topbar-panel topbar-lb-btn ${lbOpen ? 'is-open' : ''}`}
                        onClick={() => {audioEngine.playSfx('buttonClick'); setLbOpen(o => !o);}}
                        aria-expanded={lbOpen}
                        aria-haspopup="dialog"
                        title="Rangliste"
                    >
                        <span className="topbar-value">Rangliste ▾</span>
                    </button>

                    {lbOpen && (
                        <div className="lb-popover" role="dialog" aria-label="Rangliste">
                            {sortedLb.length === 0 ? (
                                <div className="lb-popover-empty">Lade…</div>
                            ) : (
                                <ul className="lb-popover-list">
                                    {sortedLb.map(e => {
                                        const isMe = playerId === e.playerId;
                                        return (
                                            <li key={e.playerId} className={`lb-popover-row ${isMe ? 'me' : ''}`}>
                                                <span className="lb-popover-rank">#{e.rank}</span>
                                                <span className="lb-popover-name">{e.playerName}</span>
                                                <span className="lb-popover-total">
                                                    {Math.round(e.totalValue).toLocaleString('de-DE')} T
                                                </span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
                <div className="topbar-audio-wrapper" ref={audioMenuRef}>
                    <button
                        type="button"
                        className={`topbar-panel topbar-audio-btn ${audioMenuOpen ? 'is-open' : ''}`}
                        onClick={() => {audioEngine.playSfx('buttonClick'); setAudioMenuOpen(o => !o);}}
                        aria-expanded={audioMenuOpen}
                        aria-haspopup="dialog"
                        title="Einstellungen"
                    >
                        <span className="topbar-value topbar-hamburger">☰</span>
                    </button>

                    {audioMenuOpen && (
                        <div className="audio-popover" role="dialog" aria-label="Audio Einstellungen">
                            <h3 className="audio-popover-title">Audio</h3>

                            <div className="audio-popover-row">
                                <span className="audio-popover-label">🎵 Musik</span>
                                <div className="audio-popover-controls">
                                    <button
                                        className={`audio-popover-toggle ${settings.musicEnabled ? 'on' : 'off'}`}
                                        onClick={() => {setMusicEnabled(!settings.musicEnabled); audioEngine.playSfx('buttonClick');}}
                                    >
                                        {settings.musicEnabled ? 'AN' : 'AUS'}
                                    </button>
                                    <input
                                        type="range"
                                        min={0}
                                        max={100}
                                        value={Math.round(settings.musicVolume * 100)}
                                        onChange={(e) => setMusicVolume(Number(e.target.value) / 100)}
                                        disabled={!settings.musicEnabled}
                                        className="audio-popover-slider"
                                    />
                                    <span className="audio-popover-pct">
                                        {Math.round(settings.musicVolume * 100)}%
                                    </span>
                                </div>
                            </div>

                            <div className="audio-popover-row">
                                <span className="audio-popover-label">🔔 Effekte</span>
                                <div className="audio-popover-controls">
                                    <button
                                        className={`audio-popover-toggle ${settings.sfxEnabled ? 'on' : 'off'}`}
                                        onClick={() => {setSfxEnabled(!settings.sfxEnabled); audioEngine.playSfx('buttonClick');}}
                                    >
                                        {settings.sfxEnabled ? 'AN' : 'AUS'}
                                    </button>
                                    <input
                                        type="range"
                                        min={0}
                                        max={100}
                                        value={Math.round(settings.sfxVolume * 100)}
                                        onChange={(e) => setSfxVolume(Number(e.target.value) / 100)}
                                        disabled={!settings.sfxEnabled}
                                        className="audio-popover-slider"
                                    />
                                    <span className="audio-popover-pct">
                                        {Math.round(settings.sfxVolume * 100)}%
                                    </span>
                                </div>
                            </div>

                            <div className="audio-popover-divider" />

                            <button
                                className="audio-popover-help"
                                onClick={() => { audioEngine.playSfx('buttonClick'); setAudioMenuOpen(false); setHelpOpen(true); }}
                            >
                                Hilfecenter öffnen
                            </button>

                            <button className="audio-popover-leave" disabled={leaving} onClick={handleLeaveSession}>
                                {leaving ? 'Verlasse …' : 'Zurück zur Lobby'}
                            </button>

                        </div>
                    )}
                </div>
            </div>

            {showEndingToast && ticksRemaining !== null && (
                <div className={`ending-toast ${endingToastHiding ? 'hiding' : ''}`}>
                    <div className="ending-toast-icon">⏳</div>
                    <div>
                        <div className="ending-toast-text">Das Spiel endet bald!</div>
                        <div className="ending-toast-sub">
                            Noch {ticksRemaining} {ticksRemaining === 1 ? 'Tag' : 'Tage'} übrig
                        </div>
                    </div>
                    <button
                        className="ending-toast-close"
                        onClick={() => {
                            setEndingToastHiding(true);
                            setTimeout(() => {
                                setShowEndingToast(false);
                                setEndingToastHiding(false);
                            }, 400);
                        }}
                    >✕</button>
                </div>
            )}

            <HelpCenter open={helpOpen} onClose={() => setHelpOpen(false)} showTutorialRestart />

        </div>
    );
}
