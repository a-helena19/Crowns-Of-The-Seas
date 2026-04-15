package at.fhv.backend.domain.model.port;

public class Coordinates {
    private final double x;
    private final double y;

    private Coordinates(double x, double y) {
        this.x = x;
        this.y = y;
    }

    public static Coordinates of(double x, double y) {
        return new Coordinates(x, y);
    }

    public double distanceTo(Coordinates other) {
        double dx = this.x - other.x;
        double dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    public double getX() {
        return x;
    }

    public double getY() {
        return y;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Coordinates other)) return false;
        return Double.compare(x, other.x) == 0 && Double.compare(y, other.y) == 0;
    }

    @Override
    public int hashCode() {
        return 31 * Double.hashCode(x) + Double.hashCode(y);
    }
}
