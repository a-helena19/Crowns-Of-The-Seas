package at.fhv.backend.domain.model.route;

import java.util.Objects;
import java.util.UUID;

public final class RouteId {
    private final UUID value;

    private RouteId(UUID value) {
        this.value = Objects.requireNonNull(value);
    }

    public static RouteId generate() {
        return new RouteId(UUID.randomUUID());
    }

    public static RouteId of(UUID value) {
        return new RouteId(value);
    }

    public UUID getValue() {
        return value;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof RouteId other)) return false;
        return value.equals(other.value);
    }

    @Override
    public int hashCode() {
        return value.hashCode();
    }
}

