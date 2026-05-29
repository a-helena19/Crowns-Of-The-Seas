import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { adminApi, type AdminShip, type AdminCargo } from "../api/adminApi";
import "../style/admin.css";
import audioEngine from "../audio/AudioEngine.ts";
import BackButton from "../components/BackButton.tsx";

const SHIP_CLASSES = ["BUDGET", "STANDARD", "PREMIUM"] as const;
const CARGO_TYPES = [
    "GENERAL_GOODS", "FOOD", "INDUSTRIAL_GOODS",
    "ELECTRONICS", "FRAGILE", "HAZARDOUS", "LUXURY_GOODS",
] as const;

const EMPTY_SHIP: AdminShip = {
    name: "", description: "", shipClass: "BUDGET", price: 10000,
    maxCargoCapacity: 30, maxSpeed: 15, fuelConsumption: 1.0,
    maxFuel: 100, operatingCost: 500, baseReliability: 0.9,
    iconUrl: "", stock: 20,
};

const EMPTY_CARGO: AdminCargo = {
    name: "", description: "", baseReward: 1000, capacity: 10,
    cargoType: "GENERAL_GOODS", risk: 0.1,
};

export default function AdminPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [tab, setTab] = useState<"ships" | "cargos">("ships");

    // Ships
    const [ships, setShips] = useState<AdminShip[]>([]);
    const [editShip, setEditShip] = useState<AdminShip | null>(null);
    const [shipForm, setShipForm] = useState<AdminShip>(EMPTY_SHIP);

    // Cargos
    const [cargos, setCargos] = useState<AdminCargo[]>([]);
    const [editCargo, setEditCargo] = useState<AdminCargo | null>(null);
    const [cargoForm, setCargoForm] = useState<AdminCargo>(EMPTY_CARGO);

    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const [toastError, setToastError] = useState(false);

    useEffect(() => {
        if (!user || user.role !== "ADMIN") {
            navigate("/lobby");
            return;
        }
        loadData();
    }, [user, navigate]);

    useEffect(() => {
        audioEngine.playMusic('lobby');
        return () => {};
    }, []);

    async function loadData() {
        try {
            const [s, c] = await Promise.all([adminApi.getShips(), adminApi.getCargos()]);
            setShips(s);
            setCargos(c);
        } catch (err) {
            console.error("Admin: Load failed", err);
        }
    }

    function showToast(msg: string, isError = false) {
        setToast(msg);
        setToastError(isError);
        setTimeout(() => setToast(null), 3000);
    }

    // ── Ship CRUD ──

    function handleEditShip(ship: AdminShip) {
        setEditShip(ship);
        setShipForm({ ...ship });
    }

    function handleNewShip() {
        setEditShip(null);
        setShipForm({ ...EMPTY_SHIP });
    }

    async function handleSaveShip() {
        const error = validateShipForm();
        if (error) { showToast(error); return; }

        setSaving(true);
        try {
            if (editShip?.id) {
                await adminApi.updateShip(editShip.id, shipForm);
                showToast(`Schiff "${shipForm.name}" aktualisiert`);
            } else {
                await adminApi.createShip(shipForm);
                showToast(`Schiff "${shipForm.name}" erstellt`);
            }
            setEditShip(null);
            setShipForm({ ...EMPTY_SHIP });
            await loadData();
        } catch (err) {
            showToast("Fehler beim Speichern");
        }
        setSaving(false);
    }

    async function handleDeleteShip(id: string, name: string) {
        if (!confirm(`Schiff "${name}" wirklich löschen?`)) return;
        try {
            await adminApi.deleteShip(id);
            showToast(`Schiff "${name}" gelöscht`);
            await loadData();
        } catch { showToast("Fehler beim Löschen"); }
    }

    // ── Cargo CRUD ──

    function handleEditCargo(cargo: AdminCargo) {
        setEditCargo(cargo);
        setCargoForm({ ...cargo });
    }

    function handleNewCargo() {
        setEditCargo(null);
        setCargoForm({ ...EMPTY_CARGO });
    }

    async function handleSaveCargo() {
        const error = validateCargoForm();
        if (error) { showToast(error); return; }

        setSaving(true);
        try {
            if (editCargo?.id) {
                await adminApi.updateCargo(editCargo.id, cargoForm);
                showToast(`Fracht "${cargoForm.name}" aktualisiert`);
            } else {
                await adminApi.createCargo(cargoForm);
                showToast(`Fracht "${cargoForm.name}" erstellt`);
            }
            setEditCargo(null);
            setCargoForm({ ...EMPTY_CARGO });
            await loadData();
        } catch {
            showToast("Fehler beim Speichern");
        }
        setSaving(false);
    }

    async function handleDeleteCargo(id: string, name: string) {
        if (!confirm(`Fracht "${name}" wirklich löschen?`)) return;
        try {
            await adminApi.deleteCargo(id);
            showToast(`Fracht "${name}" gelöscht`);
            await loadData();
        } catch { showToast("Fehler beim Löschen"); }
    }

    function validateShipForm(): string | null {
        if (!shipForm.name.trim()) return "Name ist erforderlich";
        if (!shipForm.description.trim()) return "Beschreibung ist erforderlich";
        if (shipForm.price <= 0) return "Preis muss größer als 0 sein";
        if (shipForm.maxCargoCapacity <= 0) return "Cargo-Kapazität muss größer als 0 sein";
        if (shipForm.maxSpeed <= 0) return "Geschwindigkeit muss größer als 0 sein";
        if (shipForm.fuelConsumption <= 0) return "Treibstoffverbrauch muss größer als 0 sein";
        if (shipForm.maxFuel <= 0) return "Max. Treibstoff muss größer als 0 sein";
        if (shipForm.operatingCost < 0) return "Betriebskosten dürfen nicht negativ sein";
        if (shipForm.baseReliability < 0 || shipForm.baseReliability > 1) return "Zuverlässigkeit muss zwischen 0 und 1 liegen";
        if (shipForm.stock < 0) return "Bestand darf nicht negativ sein";
        if (!shipForm.iconUrl.trim()) return "Icon URL ist erforderlich";
        return null;
    }

    function validateCargoForm(): string | null {
        if (!cargoForm.name.trim()) return "Name ist erforderlich";
        if (!cargoForm.description.trim()) return "Beschreibung ist erforderlich";
        if (cargoForm.baseReward <= 0) return "Belohnung muss größer als 0 sein";
        if (cargoForm.capacity <= 0) return "Kapazität muss größer als 0 sein";
        if (cargoForm.risk < 0 || cargoForm.risk > 1) return "Risiko muss zwischen 0 und 1 liegen";
        return null;
    }

    // ── Render ──

    return (
        <div className="admin-page">
            <div className="admin-header">
                <h1 className="admin-title">⚙ Verwaltung</h1>
                <BackButton onClick={() => navigate("/lobby")} />
            </div>

            <div className="admin-tabs">
                <button
                    className={`admin-tab ${tab === "ships" ? "active" : ""}`}
                    onClick={() => setTab("ships")}
                >
                    🚢 Schiffe ({ships.length})
                </button>
                <button
                    className={`admin-tab ${tab === "cargos" ? "active" : ""}`}
                    onClick={() => setTab("cargos")}
                >
                    📦 Frachten ({cargos.length})
                </button>
            </div>

            <div className="admin-content">
                {/* ── Ships Tab ── */}
                {tab === "ships" && (
                    <>
                        <div className="admin-toolbar">
                            <button className="admin-add-btn" onClick={handleNewShip}>
                                + Neues Schiff
                            </button>
                        </div>

                        <div className="admin-form-card">
                            <h3>{editShip?.id ? `Bearbeiten: ${editShip.name}` : "Neues Schiff erstellen"}</h3>
                            <div className="admin-form-grid">
                                <label>
                                    Name
                                    <input value={shipForm.name} required
                                           onChange={e => setShipForm(f => ({ ...f, name: e.target.value }))} />
                                </label>
                                <label>
                                    Beschreibung
                                    <input value={shipForm.description} required
                                           onChange={e => setShipForm(f => ({ ...f, description: e.target.value }))} />
                                </label>
                                <label>
                                    Klasse
                                    <select value={shipForm.shipClass}
                                            onChange={e => setShipForm(f => ({ ...f, shipClass: e.target.value as any }))}>
                                        {SHIP_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </label>
                                <label>
                                    Preis
                                    <input type="number" value={shipForm.price}
                                           onChange={e => setShipForm(f => ({ ...f, price: +e.target.value }))} />
                                </label>
                                <label>
                                    Max. Cargo (t)
                                    <input type="number" value={shipForm.maxCargoCapacity}
                                           onChange={e => setShipForm(f => ({ ...f, maxCargoCapacity: +e.target.value }))} />
                                </label>
                                <label>
                                    Max. Speed (kn)
                                    <input type="number" step="0.1" value={shipForm.maxSpeed}
                                           onChange={e => setShipForm(f => ({ ...f, maxSpeed: +e.target.value }))} />
                                </label>
                                <label>
                                    Treibstoffverbrauch
                                    <input type="number" step="0.1" value={shipForm.fuelConsumption}
                                           onChange={e => setShipForm(f => ({ ...f, fuelConsumption: +e.target.value }))} />
                                </label>
                                <label>
                                    Max. Treibstoff
                                    <input type="number" value={shipForm.maxFuel}
                                           onChange={e => setShipForm(f => ({ ...f, maxFuel: +e.target.value }))} />
                                </label>
                                <label>
                                    Betriebskosten
                                    <input type="number" value={shipForm.operatingCost}
                                           onChange={e => setShipForm(f => ({ ...f, operatingCost: +e.target.value }))} />
                                </label>
                                <label>
                                    Zuverlässigkeit (0-1)
                                    <input type="number" step="0.01" min="0" max="1" value={shipForm.baseReliability}
                                           onChange={e => setShipForm(f => ({ ...f, baseReliability: +e.target.value }))} />
                                </label>
                                <label>
                                    Icon URL
                                    <input value={shipForm.iconUrl} required
                                           onChange={e => setShipForm(f => ({ ...f, iconUrl: e.target.value }))} />
                                </label>
                                <label>
                                    Bestand
                                    <input type="number" value={shipForm.stock}
                                           onChange={e => setShipForm(f => ({ ...f, stock: +e.target.value }))} />
                                </label>
                            </div>
                            <div className="admin-form-actions">
                                <button className="admin-save-btn" onClick={handleSaveShip} disabled={saving}>
                                    {saving ? "Speichert..." : editShip?.id ? "Aktualisieren" : "Erstellen"}
                                </button>
                                <button className="admin-cancel-btn"
                                        onClick={() => { setEditShip(null); setShipForm({ ...EMPTY_SHIP }); }}>
                                    Abbrechen
                                </button>
                            </div>
                        </div>

                        <table className="admin-table">
                            <thead>
                            <tr>
                                <th>Name</th>
                                <th>Klasse</th>
                                <th>Preis</th>
                                <th>Cargo</th>
                                <th>Speed</th>
                                <th>Bestand</th>
                                <th>Aktionen</th>
                            </tr>
                            </thead>
                            <tbody>
                            {ships.map(s => (
                                <tr key={s.id}>
                                    <td>{s.name}</td>
                                    <td>{s.shipClass}</td>
                                    <td>{s.price.toLocaleString("de")} T</td>
                                    <td>{s.maxCargoCapacity} t</td>
                                    <td>{s.maxSpeed} kn</td>
                                    <td>{s.stock}</td>
                                    <td>
                                        <button className="admin-edit-btn" onClick={() => handleEditShip(s)}>✏️</button>
                                        <button className="admin-delete-btn" onClick={() => handleDeleteShip(s.id!, s.name)}>🗑️</button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </>
                )}

                {/* ── Cargos Tab ── */}
                {tab === "cargos" && (
                    <>
                        <div className="admin-toolbar">
                            <button className="admin-add-btn" onClick={handleNewCargo}>
                                + Neue Fracht
                            </button>
                        </div>

                        <div className="admin-form-card">
                            <h3>{editCargo?.id ? `Bearbeiten: ${editCargo.name}` : "Neue Fracht erstellen"}</h3>
                            <div className="admin-form-grid">
                                <label>
                                    Name
                                    <input value={cargoForm.name} required
                                           onChange={e => setCargoForm(f => ({ ...f, name: e.target.value }))} />
                                </label>
                                <label>
                                    Beschreibung
                                    <input value={cargoForm.description} required
                                           onChange={e => setCargoForm(f => ({ ...f, description: e.target.value }))} />
                                </label>
                                <label>
                                    Typ
                                    <select value={cargoForm.cargoType}
                                            onChange={e => setCargoForm(f => ({ ...f, cargoType: e.target.value }))}>
                                        {CARGO_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
                                    </select>
                                </label>
                                <label>
                                    Grundbelohnung
                                    <input type="number" value={cargoForm.baseReward}
                                           onChange={e => setCargoForm(f => ({ ...f, baseReward: +e.target.value }))} />
                                </label>
                                <label>
                                    Kapazität (t)
                                    <input type="number" value={cargoForm.capacity}
                                           onChange={e => setCargoForm(f => ({ ...f, capacity: +e.target.value }))} />
                                </label>
                                <label>
                                    Risiko (0-1)
                                    <input type="number" step="0.01" min="0" max="1" value={cargoForm.risk}
                                           onChange={e => setCargoForm(f => ({ ...f, risk: +e.target.value }))} />
                                </label>
                            </div>
                            <div className="admin-form-actions">
                                <button className="admin-save-btn" onClick={handleSaveCargo} disabled={saving}>
                                    {saving ? "Speichert..." : editCargo?.id ? "Aktualisieren" : "Erstellen"}
                                </button>
                                <button className="admin-cancel-btn"
                                        onClick={() => { setEditCargo(null); setCargoForm({ ...EMPTY_CARGO }); }}>
                                    Abbrechen
                                </button>
                            </div>
                        </div>

                        <table className="admin-table">
                            <thead>
                            <tr>
                                <th>Name</th>
                                <th>Typ</th>
                                <th>Belohnung</th>
                                <th>Kapazität</th>
                                <th>Risiko</th>
                                <th>Aktionen</th>
                            </tr>
                            </thead>
                            <tbody>
                            {cargos.map(c => (
                                <tr key={c.id}>
                                    <td>{c.name}</td>
                                    <td>{c.cargoType.replace(/_/g, " ")}</td>
                                    <td>{c.baseReward.toLocaleString("de")} T</td>
                                    <td>{c.capacity} t</td>
                                    <td>{(c.risk * 100).toFixed(0)}%</td>
                                    <td>
                                        <button className="admin-edit-btn" onClick={() => handleEditCargo(c)}>✏️</button>
                                        <button className="admin-delete-btn" onClick={() => handleDeleteCargo(c.id!, c.name)}>🗑️</button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </>
                )}
            </div>

            {/* Toast */}
            {toast && <div className={`admin-toast ${toastError ? 'error' : ''}`}>{toast}</div>}
        </div>
    );
}