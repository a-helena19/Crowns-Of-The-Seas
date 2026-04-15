package at.fhv.backend.port.domain.model;

import java.util.UUID;

public class PortId {
    private final UUID value;

    private PortId(UUID value) {
        this.value = value;
    }

    public static PortId of(UUID value) {
        return new PortId(value);
    }

    public static PortId generate() {
        return new PortId(UUID.randomUUID());
    }

    public UUID getValue() {
        return value;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof PortId other)) return false;
        return value.equals(other.value);
    }

    @Override
    public int hashCode() {
        return value.hashCode();
    }

    @Override
    public String toString() {
        return value.toString();
    }
}
