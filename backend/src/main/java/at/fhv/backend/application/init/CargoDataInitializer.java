package at.fhv.backend.application.init;

import at.fhv.backend.domain.model.cargo.Cargo;
import at.fhv.backend.domain.model.cargo.CargoRepository;
import at.fhv.backend.domain.model.cargo.CargoType;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Component
public class CargoDataInitializer implements ApplicationRunner {

    private final CargoRepository cargoRepository;

    public CargoDataInitializer(CargoRepository cargoRepository) {
        this.cargoRepository = cargoRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!cargoRepository.findAll().isEmpty()) {
            return;
        }

        List<Cargo> defaultCargos = List.of(
                Cargo.reconstruct(UUID.fromString("dd89316f-d736-41a8-a90b-458b84da7100"), "Barrel Goods", "Assorted barrels of everyday merchandise. Low risk, steady demand in every port.", new BigDecimal("420.00"), 20, CargoType.GENERAL_GOODS, 0.05),
                Cargo.reconstruct(UUID.fromString("f374ae63-2f8e-4303-bea9-e43fd4f6a070"), "Textile Bales", "Bolts of cloth and linen. Compact and easy to handle, wanted across all trade routes.", new BigDecimal("380.00"), 18, CargoType.GENERAL_GOODS, 0.05),
                Cargo.reconstruct(UUID.fromString("8731ac92-7d47-4527-905b-b5d90b6fdb54"), "Clay Pottery", "Crates of everyday ceramic ware. Bulky but inexpensive to insure.", new BigDecimal("350.00"), 22, CargoType.GENERAL_GOODS, 0.07),
                Cargo.reconstruct(UUID.fromString("99112fd8-6693-4e80-815c-fb98a1e69f43"), "Salt Fish", "Barrels of preserved cod and herring. Spoils quickly — deliver promptly.", new BigDecimal("340.00"), 15, CargoType.FOOD, 0.08),
                Cargo.reconstruct(UUID.fromString("d5dfc128-bd3f-4bb4-b31a-b7f8a6b18454"), "Grain Sacks", "Bushels of wheat and rye. Heavy, but always needed at every port of call.", new BigDecimal("310.00"), 25, CargoType.FOOD, 0.06),
                Cargo.reconstruct(UUID.fromString("ad6ce61f-2e1a-4ed6-932a-804671c46a90"), "Spice Chests", "Cinnamon, pepper and clove. Light cargo, surprising profit margin.", new BigDecimal("460.00"), 10, CargoType.FOOD, 0.09),
                Cargo.reconstruct(UUID.fromString("2c85344b-2bb0-48d6-84e0-d165251076ea"), "Copper Ingots", "Raw refined copper ready for the foundry. Heavy and valuable.", new BigDecimal("620.00"), 35, CargoType.INDUSTRIAL_GOODS, 0.1),
                Cargo.reconstruct(UUID.fromString("63f0e6c5-27a0-4435-a74c-c079c7d87aea"), "Timber Planks", "Seasoned oak for shipwrights and builders. Bulky but in high demand.", new BigDecimal("540.00"), 40, CargoType.INDUSTRIAL_GOODS, 0.08),
                Cargo.reconstruct(UUID.fromString("e79b900a-9f61-474e-b395-f7f7c09188ba"), "Rope & Rigging", "Coiled hemp rope and iron fittings — the backbone of any fleet.", new BigDecimal("500.00"), 28, CargoType.INDUSTRIAL_GOODS, 0.09),
                Cargo.reconstruct(UUID.fromString("491a7fcf-cbcf-41a3-9ffd-54273ca9e2e4"), "Navigation Instruments", "Sextants, chronometers and compasses from the finest workshops. Handle with care.", new BigDecimal("780.00"), 12, CargoType.ELECTRONICS, 0.14),
                Cargo.reconstruct(UUID.fromString("54ec7ea5-9d62-4391-b78e-89f9d1357e30"), "Signal Apparatus", "Optical telegraph components and signal lamps. Fragile and proprietary.", new BigDecimal("850.00"), 14, CargoType.ELECTRONICS, 0.16),
                Cargo.reconstruct(UUID.fromString("b175d489-8804-439c-9d92-351d4d3c387e"), "Clockwork Mechanisms", "Precision gear assemblies destined for clockmakers and automaton builders.", new BigDecimal("720.00"), 10, CargoType.ELECTRONICS, 0.15),
                Cargo.reconstruct(UUID.fromString("1ed3e6f9-f2f6-4342-97a6-4cee883759af"), "Venetian Glassware", "Exquisite hand-blown glass from Murano. One rough wave can cost you dearly.", new BigDecimal("680.00"), 8, CargoType.FRAGILE, 0.2),
                Cargo.reconstruct(UUID.fromString("831395ed-6b47-420c-a2d3-c2420495e60c"), "Porcelain Sets", "Imperial porcelain service — any breakage reduces the payout significantly.", new BigDecimal("730.00"), 10, CargoType.FRAGILE, 0.22),
                Cargo.reconstruct(UUID.fromString("9e98cbe5-bbbd-4de3-ad29-7d9b08ead7e8"), "Observatory Lenses", "Ground optical glass for telescopes. Irreplaceable if lost.", new BigDecimal("760.00"), 6, CargoType.FRAGILE, 0.24),
                Cargo.reconstruct(UUID.fromString("a84dda43-b31c-49f5-8bc7-fa9d62db47f2"), "Black Powder Kegs", "Military-grade gunpowder. Requires careful stowage away from heat and sparks.", new BigDecimal("900.00"), 18, CargoType.HAZARDOUS, 0.35),
                Cargo.reconstruct(UUID.fromString("0ee1ee52-f383-49b8-a9dd-887c744979df"), "Alchemical Reagents", "Volatile compounds for apothecaries and dye-works. Classified manifest required.", new BigDecimal("960.00"), 14, CargoType.HAZARDOUS, 0.38),
                Cargo.reconstruct(UUID.fromString("4b7037c1-9cdd-4528-8c70-d9c45d877d1b"), "Acid Carboys", "Large glass demijohns of industrial acid packed in straw crates. Leaks are catastrophic.", new BigDecimal("1020.00"), 16, CargoType.HAZARDOUS, 0.4),
                Cargo.reconstruct(UUID.fromString("0b0af1dc-420d-40a2-bf42-515de083dba7"), "Gold Bullion", "Stamped gold bars from the royal mint. Extraordinary value — and extraordinary risk.", new BigDecimal("1800.00"), 8, CargoType.LUXURY_GOODS, 0.3),
                Cargo.reconstruct(UUID.fromString("fb0d2f79-22fd-4db9-bae9-45d853d7fd2b"), "Rare Paintings", "A private collection of oil paintings bound for a distant patron. Priceless if delivered intact.", new BigDecimal("1650.00"), 6, CargoType.LUXURY_GOODS, 0.28),
                Cargo.reconstruct(UUID.fromString("b8f00832-2e31-45f7-9d04-97bc1f14f552"), "Exotic Silk Rolls", "Finest silk from the Far East, dyed in colours unseen in European markets.", new BigDecimal("1500.00"), 10, CargoType.LUXURY_GOODS, 0.25)
        );

        defaultCargos.forEach(cargoRepository::save);
    }
}
