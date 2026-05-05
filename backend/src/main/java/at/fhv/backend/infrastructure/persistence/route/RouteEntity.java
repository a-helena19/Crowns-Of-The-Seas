package at.fhv.backend.infrastructure.persistence.route;

import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "routes")
public class RouteEntity {

    @Id @Column(nullable = false, updatable = false)
    private UUID id;

    @Column(name = "origin_port_id", nullable = false)
    private UUID originPortId;

    @Column(name = "destination_port_id", nullable = false)
    private UUID destinationPortId;

    @Column(nullable = false)
    private double distance;

    @Column
    private String description;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "route_waypoints",
            joinColumns = @JoinColumn(name = "route_id")
    )
    @OrderColumn(name = "waypoint_order")
    private List<WaypointEmbeddable> waypoints = new ArrayList<>();

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getOriginPortId() {
        return originPortId;
    }

    public void setOriginPortId(UUID originPortId) {
        this.originPortId = originPortId;
    }

    public UUID getDestinationPortId() {
        return destinationPortId;
    }

    public void setDestinationPortId(UUID destinationPortId) {
        this.destinationPortId = destinationPortId;
    }

    public double getDistance() {
        return distance;
    }

    public void setDistance(double distance) {
        this.distance = distance;
    }

    public List<WaypointEmbeddable> getWaypoints() {
        return waypoints;
    }

    public void setWaypoints(List<WaypointEmbeddable> waypoints) {
        this.waypoints = waypoints;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
