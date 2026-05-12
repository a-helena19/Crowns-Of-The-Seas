package at.fhv.backend.application.init;

import at.fhv.backend.domain.model.cargo.*;
import at.fhv.backend.domain.model.port.Port;
import at.fhv.backend.domain.model.port.PortRepository;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.*;


@Component
public class CargoSessionInitializer {

    private final CargoRepository cargoRepository;
    private final SessionCargoRepository sessionCargoRepository;
    private final PortRepository portRepository;

    private static final int MAX_CARGOS_PER_PORT = 6;
    private static final int GENERAL_FILL_TARGET = 4;
    private static final int PERMANENT_PER_PORT = 1;

    private static final int CARGO_VISIBILITY_DELAY = 3;

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

            portOffers.addAll(pickOffers(byType, CargoType.GENERAL_GOODS, PERMANENT_PER_PORT, origin, destinations, sessionId, rng, true));

            portOffers.addAll(pickOffers(byType, CargoType.GENERAL_GOODS, 1, origin, destinations, sessionId, rng, false));
            portOffers.addAll(pickOffers(byType, CargoType.FOOD,          1, origin, destinations, sessionId, rng, false));

            portOffers.addAll(pickOffers(byType, CargoType.INDUSTRIAL_GOODS, rng.nextBoolean() ? 1 : 0, origin, destinations, sessionId, rng, false));
            portOffers.addAll(pickOffers(byType, CargoType.FRAGILE,          rng.nextBoolean() ? 1 : 0, origin, destinations, sessionId, rng, false));
            portOffers.addAll(pickOffers(byType, CargoType.ELECTRONICS,      rng.nextBoolean() ? 1 : 0, origin, destinations, sessionId, rng, false));

            if (rng.nextInt(4) == 0) {
                portOffers.addAll(pickOffers(byType, CargoType.HAZARDOUS, 1, origin, destinations, sessionId, rng, false));
            }
            if (rng.nextInt(6) == 0) {
                portOffers.addAll(pickOffers(byType, CargoType.LUXURY_GOODS, 1, origin, destinations, sessionId, rng, false));
            }

            while (portOffers.size() < GENERAL_FILL_TARGET) {
                List<SessionCargo> picked = pickOffers(byType, CargoType.GENERAL_GOODS, 1, origin, destinations, sessionId, rng, false);
                if (picked.isEmpty()) break;
                portOffers.addAll(picked);
            }

            offers.addAll(portOffers.subList(0, Math.min(portOffers.size(), MAX_CARGOS_PER_PORT)));
        }

        offers.forEach(sessionCargoRepository::save);
    }

    /**
     * Creates a new SessionCargo from a random Cargo template for the given port.
     * Used by GameTickScheduler to spawn fresh cargos when AVAILABLE count drops below MAX.
     */
    public SessionCargo createNewCargo(UUID sessionId, UUID originPortId, int currentTick, Random rng, boolean permanent) {
        List<Cargo> templates = cargoRepository.findAll();
        List<Port> ports = portRepository.findAll();
        if (templates.isEmpty() || ports.size() < 2) return null;

        Map<CargoType, List<Cargo>> byType = new EnumMap<>(CargoType.class);
        for (Cargo c : templates) {
            byType.computeIfAbsent(c.getCargoType(), k -> new ArrayList<>()).add(c);
        }

        CargoType type = pickRandomCargoType(rng);
        List<Cargo> pool = byType.getOrDefault(type, Collections.emptyList());
        if (pool.isEmpty()) {
            pool = byType.getOrDefault(CargoType.GENERAL_GOODS, Collections.emptyList());
            type = CargoType.GENERAL_GOODS;
        }
        if (pool.isEmpty()) return null;

        List<Port> destinations = new ArrayList<>();
        for (Port p : ports) {
            if (!p.getId().getValue().equals(originPortId)) {
                destinations.add(p);
            }
        }
        if (destinations.isEmpty()) return null;
        Collections.shuffle(destinations, rng);

        Cargo template = pool.get(rng.nextInt(pool.size()));
        Port dest = destinations.get(0);
        CargoSpawnConfig cfg = CargoSpawnConfig.of(type);

        double variance = 0.85 + rng.nextDouble() * 0.30;
        BigDecimal reward = template.getBaseReward()
                .multiply(BigDecimal.valueOf(cfg.rewardMultiplier))
                .multiply(BigDecimal.valueOf(variance))
                .setScale(2, java.math.RoundingMode.HALF_UP);

        return SessionCargo.create(
                template.getId(), sessionId,
                originPortId, dest.getId().getValue(),
                reward, false,
                template.getCapacity(), type, template.getRisk(),
                currentTick + CARGO_VISIBILITY_DELAY,
                cfg.lifetimeTicks,
                permanent
        );
    }

    private CargoType pickRandomCargoType(Random rng) {
        double roll = rng.nextDouble();
        if (roll < 0.30) return CargoType.GENERAL_GOODS;
        if (roll < 0.55) return CargoType.FOOD;
        if (roll < 0.70) return CargoType.INDUSTRIAL_GOODS;
        if (roll < 0.80) return CargoType.FRAGILE;
        if (roll < 0.88) return CargoType.ELECTRONICS;
        if (roll < 0.94) return CargoType.HAZARDOUS;
        return CargoType.LUXURY_GOODS;
    }

    private List<SessionCargo> pickOffers(Map<CargoType, List<Cargo>> byType,
                                          CargoType type, int count,
                                          Port origin, List<Port> destinations,
                                          UUID sessionId, Random rng, boolean permanent) {
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
                    finalSpawnTick,
                    cfg.lifetimeTicks,
                    permanent
            );
            result.add(sc);
        }
        return result;
    }

    private enum CargoSpawnConfig {
        GENERAL_GOODS   (0,  1.00, 12),
        FOOD            (0,  0.90, 10),
        INDUSTRIAL_GOODS(0,  1.20, 14),
        ELECTRONICS     (5,  1.50, 16),
        FRAGILE         (3,  1.30, 14),
        HAZARDOUS       (8,  1.60, 18),
        LUXURY_GOODS    (20, 2.50, 22);

        final int spawnTick;
        final double rewardMultiplier;
        final int lifetimeTicks;

        CargoSpawnConfig(int spawnTick, double rewardMultiplier, int lifetimeTicks) {
            this.spawnTick = spawnTick;
            this.rewardMultiplier = rewardMultiplier;
            this.lifetimeTicks = lifetimeTicks;
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

        int lifetimeTicks() {
            return lifetimeTicks;
        }
    }

    public static int lifetimeTicksFor(CargoType type) {
        return CargoSpawnConfig.of(type).lifetimeTicks();
    }
}
