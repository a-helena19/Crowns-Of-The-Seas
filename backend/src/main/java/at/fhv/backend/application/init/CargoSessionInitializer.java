package at.fhv.backend.application.init;

import at.fhv.backend.domain.model.cargo.*;
import at.fhv.backend.domain.model.port.Port;
import at.fhv.backend.domain.model.port.PortRepository;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.*;

/**
 * Type           spawnTick   cooldownTicks   rewardMultiplier   containsIllegal chance
 * GENERAL_GOODS     0           5               1.0x               0%
 * FOOD              0           4               0.9x               0%
 * INDUSTRIAL_GOODS  0           8               1.2x               0%
 * ELECTRONICS       5           10              1.5x               5%
 * FRAGILE           3           8               1.3x               0%
 * HAZARDOUS         8           12              1.6x               30%
 * LUXURY_GOODS      20          18              2.5x               10%
 *
 * Cooldown-Varianz: ±30% beim Respawn (siehe randomizedCooldownFor)
 */
@Component
public class CargoSessionInitializer {

    private final CargoRepository cargoRepository;
    private final SessionCargoRepository sessionCargoRepository;
    private final PortRepository portRepository;

    private static final int MAX_CARGOS_PER_PORT = 6;
    private static final int GENERAL_FILL_TARGET = 4;

    public CargoSessionInitializer(CargoRepository cargoRepository, SessionCargoRepository sessionCargoRepository, PortRepository portRepository) {
        this.cargoRepository = cargoRepository;
        this.sessionCargoRepository = sessionCargoRepository;
        this.portRepository = portRepository;
    }

    public void initializeForSession(UUID sessionId) {
        if (sessionCargoRepository.existsBySessionId(sessionId)) {
            return;
        }
        List<Cargo> templates = cargoRepository.findAll();
        List<Port> ports = portRepository.findAll();
        if (templates.isEmpty() || ports.size() < 2) return;

        Map<CargoType, List<Cargo>> byType = new EnumMap<>(CargoType.class);
        for (Cargo c : templates) {
            byType.computeIfAbsent(c.getCargoType(), k -> new ArrayList<>()).add(c);
        }

        Random rng = new Random();
        List<SessionCargo> offers = new ArrayList<>();

        for (Port origin : ports) {
            List<Port> destinations = new ArrayList<>(ports);
            destinations.remove(origin);
            Collections.shuffle(destinations, rng);

            List<SessionCargo> portOffers = new ArrayList<>();

            portOffers.addAll(pickOffers(byType, CargoType.GENERAL_GOODS, 1, origin, destinations, sessionId, rng));
            portOffers.addAll(pickOffers(byType, CargoType.FOOD,          1, origin, destinations, sessionId, rng));

            portOffers.addAll(pickOffers(byType, CargoType.INDUSTRIAL_GOODS, rng.nextBoolean() ? 1 : 0, origin, destinations, sessionId, rng));
            portOffers.addAll(pickOffers(byType, CargoType.FRAGILE,          rng.nextBoolean() ? 1 : 0, origin, destinations, sessionId, rng));
            portOffers.addAll(pickOffers(byType, CargoType.ELECTRONICS,      rng.nextBoolean() ? 1 : 0, origin, destinations, sessionId, rng));

            if (rng.nextInt(4) == 0) {
                portOffers.addAll(pickOffers(byType, CargoType.HAZARDOUS, 1, origin, destinations, sessionId, rng));
            }
            if (rng.nextInt(6) == 0) {
                portOffers.addAll(pickOffers(byType, CargoType.LUXURY_GOODS, 1, origin, destinations, sessionId, rng));
            }

            while (portOffers.size() < GENERAL_FILL_TARGET) {
                List<SessionCargo> picked = pickOffers(byType, CargoType.GENERAL_GOODS, 1, origin, destinations, sessionId, rng);
                if (picked.isEmpty()) break;
                portOffers.addAll(picked);
            }

            offers.addAll(portOffers.subList(0, Math.min(portOffers.size(), MAX_CARGOS_PER_PORT)));
        }

        offers.forEach(sessionCargoRepository::save);
    }

    private List<SessionCargo> pickOffers(Map<CargoType, List<Cargo>> byType,
                                          CargoType type, int count,
                                          Port origin, List<Port> destinations,
                                          UUID sessionId, Random rng) {
        List<SessionCargo> result = new ArrayList<>();
        List<Cargo> pool = byType.getOrDefault(type, Collections.emptyList());
        if (pool.isEmpty() || count <= 0) return result;

        CargoSpawnConfig cfg = CargoSpawnConfig.of(type);

        for (int i = 0; i < count && i < destinations.size(); i++) {
            Cargo template = pool.get(rng.nextInt(pool.size()));
            Port dest = destinations.get(i);

            double variance = 0.85 + rng.nextDouble() * 0.30;
            BigDecimal reward = template.getBaseReward()
                    .multiply(BigDecimal.valueOf(cfg.rewardMultiplier))
                    .multiply(BigDecimal.valueOf(variance))
                    .setScale(2, java.math.RoundingMode.HALF_UP);

            boolean illegal = false;

            int randomOffset = rng.nextInt(11);
            int finalSpawnTick = cfg.spawnTick + randomOffset;

            SessionCargo sc = SessionCargo.create(
                    template.getId(), sessionId,
                    origin.getId().getValue(), dest.getId().getValue(),
                    reward, illegal,
                    template.getCapacity(), type, template.getRisk(),
                    finalSpawnTick
            );
            result.add(sc);
        }
        return result;
    }

    private enum CargoSpawnConfig {
        GENERAL_GOODS   (0,  5,  1.00),
        FOOD            (0,  4,  0.90),
        INDUSTRIAL_GOODS(0,  8,  1.20),
        ELECTRONICS     (5,  10, 1.50),
        FRAGILE         (3,  8,  1.30),
        HAZARDOUS       (8,  12, 1.60),
        LUXURY_GOODS    (20, 18, 2.50);

        final int spawnTick;
        final int cooldownTicks;
        final double rewardMultiplier;

        CargoSpawnConfig(int spawnTick, int cooldownTicks, double rewardMultiplier) {
            this.spawnTick = spawnTick;
            this.cooldownTicks = cooldownTicks;
            this.rewardMultiplier = rewardMultiplier;
        }

        static CargoSpawnConfig of(CargoType type) {
            return switch (type) {
                case GENERAL_GOODS -> GENERAL_GOODS;
                case FOOD -> FOOD;
                case INDUSTRIAL_GOODS -> INDUSTRIAL_GOODS;
                case ELECTRONICS -> ELECTRONICS;
                case FRAGILE -> FRAGILE;
                case HAZARDOUS -> HAZARDOUS;
                case LUXURY_GOODS -> LUXURY_GOODS;
            };
        }
        int cooldownTicks() {
            return cooldownTicks;
        }
    }

    public static int cooldownTicksFor(CargoType type) {
        return CargoSpawnConfig.of(type).cooldownTicks();
    }

    public static int randomizedCooldownFor(CargoType type, Random rng) {
        int base = CargoSpawnConfig.of(type).cooldownTicks();
        double variance = 0.70 + rng.nextDouble() * 0.60; // 0.70 bis 1.30
        int result = (int) Math.round(base * variance);
        return Math.max(1, result);
    }
}