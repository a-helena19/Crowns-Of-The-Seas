package at.fhv.backend.port.domain.model;

public class Port {
    private final PortId id;
    private final String name;
    private final Coordinates coordinates;

    private Port(PortId id, String name, Coordinates coordinates) {
        this.id = id;
        this.name = name;
        this.coordinates = coordinates;
    }

    public static Port create(String name, Coordinates coordinates) {
        return new Port(PortId.generate(), name, coordinates);
    }

    public static Port reconstruct(PortId id, String name, Coordinates coordinates) {
        return new Port(id, name, coordinates);
    }

    public PortId getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public Coordinates getCoordinates() {
        return coordinates;
    }
}
