export default function InfoPanel({cargo, ship}: {
    cargo?: any;
    ship?: any;
}) {

    if (!cargo && !ship) return null;

    return (
        <div className="info-panel">

            <h3>Reederei</h3>
            <p><strong>Name:</strong> Company</p>
            <p><strong>Flottengröße:</strong> 3</p>

            <hr/>

            {ship && (
                <>
                    <h3>Ausgewähltes Schiff</h3>
                    <p><strong>Name:</strong> {ship.name}</p>
                    <p><strong>Treibstoff:</strong> {ship.fuel}</p>
                    <p><strong>Zustand:</strong> {ship.condition}</p>
                    <p><strong>Status:</strong> {ship.status}</p>

                    <hr/>
                </>
            )}

            {cargo && (
                <>
                    <h3>Ausgewählte Fracht</h3>
                    <p><strong>Von:</strong> {cargo.from}</p>
                    <p><strong>Nach:</strong> {cargo.to}</p>
                    <p><strong>Gewinn:</strong> {cargo.profit} Taler</p>
                    <p><strong>Dauer:</strong> {cargo.duration}</p>
                    <p><strong>Risiko:</strong> {cargo.risk}</p>
                </>
            )}

        </div>
    );
}