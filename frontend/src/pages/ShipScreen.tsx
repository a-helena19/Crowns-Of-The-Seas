import "../style/selectship.css"

export default function ShipScreen({ onSelect }: {
    onSelect: (ship: any) => void;
}) {
    const ship = {
        name: "Black Pearl",
        fuel: "75%",
        condition: "Gut",
        status: "Im Hafen"
    };

    return (
        <div className="ship-screen">
            <h2>Schiff auswählen</h2>
            <div className="ship-card" onClick={() => onSelect(ship)}>
                <p><strong>Name:</strong> {ship.name}</p>
                <p><strong>Treibstoff:</strong> {ship.fuel}</p>
                <p><strong>Zustand:</strong> {ship.condition}</p>
                <p><strong>Status:</strong> {ship.status}</p>
            </div>
        </div>
    );
}