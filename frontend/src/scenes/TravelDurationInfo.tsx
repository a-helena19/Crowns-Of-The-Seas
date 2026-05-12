import { useEffect, useState } from "react";

export interface SpeedDurationOption {
    speedSetting: number;
    label: string;
    // Exakt der Wert der in Phaser als totalTicks landet: totalMs = durationTicks * tickRateMs
    durationTicks: number;
}

interface Props {
    playerShipId: string | null;
    sessionCargoId: string | null;
    playerId: string | null;
    sessionId: string | null;
    token: string;
}

export function useTravelDuration({ playerShipId, sessionCargoId, playerId, sessionId, token }: Props): SpeedDurationOption[] {
    const [options, setOptions] = useState<SpeedDurationOption[]>([]);

    useEffect(() => {
        if (!playerShipId || !sessionCargoId || !playerId || !sessionId) {
            setOptions([]);
            return;
        }

        let cancelled = false;

        fetch(`/api/travels/duration-estimate?playerId=${playerId}&sessionId=${sessionId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ playerShipId, sessionCargoId }),
        })
            .then((res) => (res.ok ? (res.json() as Promise<{ options: SpeedDurationOption[] }>) : Promise.reject()))
            .then((data) => { if (!cancelled) setOptions(data.options); })
            .catch(() => { if (!cancelled) setOptions([]); });

        return () => { cancelled = true; };
    }, [playerShipId, sessionCargoId, playerId, sessionId, token]);

    return options;
}
