package at.fhv.backend.application.init;

import at.fhv.backend.domain.model.ship.ShipRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

@Component
public class ShipDataInitializer implements ApplicationRunner {

    private final ShipRepository shipRepository;
    private final JdbcTemplate jdbcTemplate;

    public ShipDataInitializer(ShipRepository shipRepository, JdbcTemplate jdbcTemplate) {
        this.shipRepository = shipRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!shipRepository.findAllAvailableOnMarket().isEmpty()) {
            return;
        }

        insertShip("c0ec3334-e916-4813-9427-ef48ac4d7fff", 0.92, "Fast lautlos unterwegs – perfekt für… sagen wir 'spezielle' Aufträge", 10, 150, "2200.00", 30, "Ocean Phantom", "290.00", "85000.00", "PREMIUM", "https://res.cloudinary.com/dflbgeyli/image/upload/v1775749403/ship9_mnainj.png", 5);
        insertShip("3f7be0eb-cd68-4fb1-9bc6-69dedd096741", 0.6, "Robust gebaut, hält auch schlechtes Wetter gut aus.", 9, 95, "1000.00", 21, "Iron Ship", "130.00", "45000.00", "STANDARD", "https://res.cloudinary.com/dflbgeyli/image/upload/v1775749404/ship1_rxkylq.png", 20);
        insertShip("03608c52-5f16-4340-9564-6aac53f6c6f0", 0.7, "Moderner Frachter mit guter Balance zwischen Speed und Kapazität.", 11, 110, "1300.00", 24, "Blue Horizon", "140.00", "50000.00", "STANDARD", "https://res.cloudinary.com/dflbgeyli/image/upload/v1775749404/ship4_wgxv8y.png", 20);
        insertShip("9b38d6f0-4012-4814-9068-9e7336fb562c", 0.65, "Arbeitet zuverlässig, beschwert sich nie. Perfekt für steady income.", 9, 90, "1100.00", 20, "Sea Mule", "120.00", "45000.00", "STANDARD", "https://res.cloudinary.com/dflbgeyli/image/upload/v1775749404/ship3_yga1sl.png", 20);
        insertShip("252514ab-47eb-407f-9906-a0b7bb9e2461", 0.88, "Extrem schnell, ideal für zeitkritische Fracht.", 14, 130, "660.00", 34, "Silver Arrow", "310.00", "78000.00", "PREMIUM", "https://res.cloudinary.com/dflbgeyli/image/upload/v1775749403/ship7_o7cinp.png", 5);
        insertShip("3c9f2641-f514-4708-b236-7c13075f210b", 0.9, "Luxuriöser High-End Frachter mit extrem stabiler Technik.", 13, 180, "2500.00", 28, "Golden Tide", "300.00", "95000.00", "PREMIUM", "https://res.cloudinary.com/dflbgeyli/image/upload/v1775749403/ship5_crbvfg.png", 10);
        insertShip("6569725a-a6ca-42e7-afc6-c8b27c938e4a", 0.85, "Ein gigantisches Schiff – langsam, aber unfassbare Kapazität.", 16, 250, "2800.00", 16, "Leviathan Carrier", "340.00", "110000.00", "PREMIUM", "https://res.cloudinary.com/dflbgeyli/image/upload/v1775749403/ship8_ibxwkd.png", 10);
        insertShip("64c58708-f896-423c-88df-afe79cc6942f", 0.4, "Klein, wendig und perfekt für kurze Strecken zwischen Häfen.", 5, 35, "500.00", 22, "Harbor Rat", "45.00", "18000.00", "BUDGET", "https://res.cloudinary.com/dflbgeyli/image/upload/v1775749404/ship2_qs9ezv.png", 30);
        insertShip("eb67653f-b92a-46e9-ab41-bf77eb0f3aa4", 0.35, "Ein alter Kahn mit mehr Rost als Farbe – aber überraschend zäh.", 6, 40, "560.00", 18, "Rusty Minnow", "50.00", "22000.00", "BUDGET", "https://res.cloudinary.com/dflbgeyli/image/upload/v1775749404/ship6_ugnhph.png", 30);
        insertShip("22581794-58b6-46c8-891e-59459cfb22b7", 0.3, "Navigationssystem fragwürdig… kommt aber meistens an.", 7, 50, "600.00", 17, "Broken Compass", "55.00", "25000.00", "BUDGET", "https://res.cloudinary.com/dflbgeyli/image/upload/v1775749403/ship10_ddkd7r.png", 10);
    }

    private void insertShip(String id, double baseReliability, String description, double fuelConsumption,
                            int maxCargoCapacity, String maxFuel, double maxSpeed, String name,
                            String operatingCost, String price, String shipClass, String iconUrl, int stock) {
        jdbcTemplate.update("""
                        INSERT INTO ships (
                            id, base_reliability, description, fuel_consumption, max_cargo_capacity,
                            max_fuel, max_speed, name, operating_cost, price, ship_class, icon_url, stock
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                UUID.fromString(id), baseReliability, description, fuelConsumption, maxCargoCapacity,
                new BigDecimal(maxFuel), maxSpeed, name, new BigDecimal(operatingCost),
                new BigDecimal(price), shipClass, iconUrl, stock);
    }
}
