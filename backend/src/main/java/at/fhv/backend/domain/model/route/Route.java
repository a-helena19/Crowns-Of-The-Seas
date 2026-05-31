package at.fhv.backend.domain.model.route;

import at.fhv.backend.domain.model.exception.SamePortException;
import at.fhv.backend.domain.model.port.Coordinates;

import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

public class Route {
    private final RouteId id;
    private final UUID originPortId;
    private final UUID destinationPortId;
    private final List<Coordinates> waypoints;
    private final double distance;
    private final String description;

    private Route(RouteId id, UUID originPortId, UUID destinationPortId,
                  List<Coordinates> waypoints, double distance, String description) {
        this.id = Objects.requireNonNull(id);
        this.originPortId = Objects.requireNonNull(originPortId);
        this.destinationPortId = Objects.requireNonNull(destinationPortId);
        this.waypoints = List.copyOf(Objects.requireNonNull(waypoints));
        this.distance = distance;
        this.description = description;
    }

    public static Route create(UUID originPortId, UUID destinationPortId,
                               Coordinates origin, Coordinates destination,
                               List<Coordinates> waypoints, String description) {
        if (originPortId.equals(destinationPortId)) {
            throw new SamePortException("Same origin and destination port", originPortId);
        }
        double distance = computeDistance(origin, destination, waypoints);
        return new Route(RouteId.generate(), originPortId, destinationPortId, waypoints, distance, description);
    }

    public static Route reconstruct(RouteId id, UUID originPortId, UUID destinationPortId,
                                    List<Coordinates> waypoints, double distance, String description) {
        return new Route(id, originPortId, destinationPortId, waypoints, distance, description);
    }

    private static final double MAP_WIDTH = 100.0;
    private static final double WRAP_X_THRESHOLD = 60.0;

    private static double segmentDistance(Coordinates a, Coordinates b) {
        double dx = Math.abs(a.getX() - b.getX());
        if (dx > WRAP_X_THRESHOLD) {
            dx = MAP_WIDTH - dx;
        }
        double dy = a.getY() - b.getY();
        return Math.hypot(dx, dy);
    }

    private static double computeDistance(Coordinates origin, Coordinates destination,
                                          List<Coordinates> waypoints) {
        if (waypoints.isEmpty()) {
            return segmentDistance(origin, destination);
        }
        double total = segmentDistance(origin, waypoints.get(0));
        for (int i = 0; i < waypoints.size() - 1; i++) {
            total += segmentDistance(waypoints.get(i), waypoints.get(i + 1));
        }
        total += segmentDistance(waypoints.get(waypoints.size() - 1), destination);
        return total;
    }

    public RouteId getId() {
        return id;
    }

    public UUID getOriginPortId() {
        return originPortId;
    }

    public UUID getDestinationPortId() {
        return destinationPortId;
    }

    public List<Coordinates> getWaypoints() {
        return Collections.unmodifiableList(waypoints);
    }

    public double getDistance() {
        return distance;
    }

    public String getDescription() {
        return description;
    }
}