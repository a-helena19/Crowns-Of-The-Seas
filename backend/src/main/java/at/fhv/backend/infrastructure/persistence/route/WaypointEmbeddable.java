package at.fhv.backend.infrastructure.persistence.route;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class WaypointEmbeddable {

    @Column(name = "x", nullable = false)
    private double x;

    @Column(name = "y", nullable = false)
    private double y;

    public WaypointEmbeddable() {
    }

    public WaypointEmbeddable(double x, double y) {
        this.x = x;
        this.y = y;
    }

    public double getX() {
        return x;
    }

    public void setX(double x) {
        this.x = x;
    }

    public double getY() {
        return y;
    }

    public void setY(double y) {
        this.y = y;
    }
}

