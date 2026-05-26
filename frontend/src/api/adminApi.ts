const token = () => localStorage.getItem("auth_token") ?? "";
const headers = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token()}`,
});

export interface AdminShip {
    id?: string;
    name: string;
    description: string;
    shipClass: "BUDGET" | "STANDARD" | "PREMIUM";
    price: number;
    maxCargoCapacity: number;
    maxSpeed: number;
    fuelConsumption: number;
    maxFuel: number;
    operatingCost: number;
    baseReliability: number;
    iconUrl: string;
    stock: number;
}

export interface AdminCargo {
    id?: string;
    name: string;
    description: string;
    baseReward: number;
    capacity: number;
    cargoType: string;
    risk: number;
}

export const adminApi = {
    // Ships
    getShips: async (): Promise<AdminShip[]> => {
        const res = await fetch("/api/admin/ships", { headers: headers() });
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
    },
    createShip: async (ship: AdminShip): Promise<AdminShip> => {
        const res = await fetch("/api/admin/ships", {
            method: "POST", headers: headers(), body: JSON.stringify(ship),
        });
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
    },
    updateShip: async (id: string, ship: AdminShip): Promise<AdminShip> => {
        const res = await fetch(`/api/admin/ships/${id}`, {
            method: "PUT", headers: headers(), body: JSON.stringify(ship),
        });
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
    },
    deleteShip: async (id: string): Promise<void> => {
        const res = await fetch(`/api/admin/ships/${id}`, {
            method: "DELETE", headers: headers(),
        });
        if (!res.ok) throw new Error(`${res.status}`);
    },

    // Cargos
    getCargos: async (): Promise<AdminCargo[]> => {
        const res = await fetch("/api/admin/cargos", { headers: headers() });
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
    },
    createCargo: async (cargo: AdminCargo): Promise<AdminCargo> => {
        const res = await fetch("/api/admin/cargos", {
            method: "POST", headers: headers(), body: JSON.stringify(cargo),
        });
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
    },
    updateCargo: async (id: string, cargo: AdminCargo): Promise<AdminCargo> => {
        const res = await fetch(`/api/admin/cargos/${id}`, {
            method: "PUT", headers: headers(), body: JSON.stringify(cargo),
        });
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
    },
    deleteCargo: async (id: string): Promise<void> => {
        const res = await fetch(`/api/admin/cargos/${id}`, {
            method: "DELETE", headers: headers(),
        });
        if (!res.ok) throw new Error(`${res.status}`);
    },
};