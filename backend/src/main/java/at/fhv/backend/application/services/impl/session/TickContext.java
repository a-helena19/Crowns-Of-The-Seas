package at.fhv.backend.application.services.impl.session;

import at.fhv.backend.domain.model.cargo.SessionCargo;
import at.fhv.backend.domain.model.session.GameSession;
import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.Ship;
import at.fhv.backend.domain.model.travel.Travel;
import at.fhv.backend.rest.dtos.port.PortResponseDTO;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Holds all data needed for a single game tick, loaded once at the start.
 * Avoids redundant DB queries by sharing pre-loaded collections across
 * all tick-processing methods.
 */
public class TickContext {

    private final UUID sessionId;
    private final GameSession session;
    private final int currentTick;

    // Pre-loaded collections (loaded once per tick)
    private final List<PlayerShip> allShips;
    private final List<Travel> activeTravels;
    private final List<Travel> arrivedTravels;
    private final List<SessionCargo> allCargos;
    private final Map<UUID, PortResponseDTO> portMap;
    private final Map<UUID, Ship> shipTemplateMap;

    // Lookup maps built from pre-loaded data
    private final Map<UUID, PlayerShip> shipById;
    private final Map<UUID, Travel> activeTravelByShipId;

    // Track modified entities for batch saving
    private final List<PlayerShip> modifiedShips = new ArrayList<>();
    private final List<Travel> modifiedTravels = new ArrayList<>();
    private final List<SessionCargo> modifiedCargos = new ArrayList<>();

    public TickContext(UUID sessionId,
                       GameSession session,
                       int currentTick,
                       List<PlayerShip> allShips,
                       List<Travel> activeTravels,
                       List<Travel> arrivedTravels,
                       List<SessionCargo> allCargos,
                       List<PortResponseDTO> allPorts,
                       List<Ship> allShipTemplates) {
        this.sessionId = sessionId;
        this.session = session;
        this.currentTick = currentTick;
        this.allShips = allShips;
        this.activeTravels = activeTravels;
        this.arrivedTravels = arrivedTravels;
        this.allCargos = allCargos;

        // Build port lookup map
        this.portMap = new HashMap<>();
        for (PortResponseDTO port : allPorts) {
            portMap.put(port.id(), port);
        }

        // Build ship template lookup map
        this.shipTemplateMap = new HashMap<>();
        for (Ship ship : allShipTemplates) {
            shipTemplateMap.put(ship.getId(), ship);
        }

        // Build ship-by-id lookup
        this.shipById = new HashMap<>();
        for (PlayerShip ship : allShips) {
            shipById.put(ship.getId(), ship);
        }

        // Build active-travel-by-shipId lookup
        this.activeTravelByShipId = new HashMap<>();
        for (Travel travel : activeTravels) {
            activeTravelByShipId.put(travel.getPlayerShipId(), travel);
        }
    }

    // --- Getters ---

    public UUID getSessionId() {
        return sessionId;
    }

    public GameSession getSession() {
        return session;
    }

    public int getCurrentTick() {
        return currentTick;
    }

    public List<PlayerShip> getAllShips() {
        return allShips;
    }

    public List<Travel> getActiveTravels() {
        return activeTravels;
    }

    public List<Travel> getArrivedTravels() {
        return arrivedTravels;
    }

    public List<SessionCargo> getAllCargos() {
        return allCargos;
    }

    public Map<UUID, PortResponseDTO> getPortMap() {
        return portMap;
    }

    public Map<UUID, Ship> getShipTemplateMap() {
        return shipTemplateMap;
    }

    public Map<UUID, Travel> getActiveTravelByShipId() {
        return activeTravelByShipId;
    }

    // --- Lookup helpers ---

    public PlayerShip getShipById(UUID shipId) {
        return shipById.get(shipId);
    }

    public Ship getShipTemplate(UUID shipTemplateId) {
        return shipTemplateMap.get(shipTemplateId);
    }

    public PortResponseDTO getPort(UUID portId) {
        return portMap.get(portId);
    }

    public List<PortResponseDTO> getAllPorts() {
        return new ArrayList<>(portMap.values());
    }

    // --- Modification tracking ---

    public void markShipModified(PlayerShip ship) {
        if (!modifiedShips.contains(ship)) {
            modifiedShips.add(ship);
        }
    }

    public void markTravelModified(Travel travel) {
        if (!modifiedTravels.contains(travel)) {
            modifiedTravels.add(travel);
        }
    }

    public void markCargoModified(SessionCargo cargo) {
        if (!modifiedCargos.contains(cargo)) {
            modifiedCargos.add(cargo);
        }
    }

    public List<PlayerShip> getModifiedShips() {
        return modifiedShips;
    }

    public List<Travel> getModifiedTravels() {
        return modifiedTravels;
    }

    public List<SessionCargo> getModifiedCargos() {
        return modifiedCargos;
    }
}