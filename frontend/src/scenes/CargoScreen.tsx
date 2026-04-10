import "../style/cargo.css"

export default function CargoScreen({ onSelect }: {
    onSelect: (cargo: any) => void;
}) {
    const cargo = {
        from: "Hamburg",
        to: "New York",
        profit: "12.000",
        duration: "5 Tage",
        risk: "Mittel",
        destinationPortId: "00000000-0000-0000-0000-000000000002", // TODO: vom Kollegen befüllen
    };

    return (
        <div className="cargo-screen">
            <h2>Frachtbörse</h2>

            <div className="cargo-card" onClick={() => onSelect(cargo)}>
                <p><strong>Von:</strong> {cargo.from}</p>
                <p><strong>Nach:</strong> {cargo.to}</p>
                <p><strong>Gewinn:</strong> {cargo.profit} Taler</p>
                <p><strong>Dauer:</strong> {cargo.duration}</p>
                <p><strong>Risiko:</strong> {cargo.risk}</p>
            </div>
        </div>
    );
}