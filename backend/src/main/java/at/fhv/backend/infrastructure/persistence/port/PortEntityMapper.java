package at.fhv.backend.infrastructure.persistence.port;

import at.fhv.backend.domain.model.port.Coordinates;
import at.fhv.backend.domain.model.port.Port;
import at.fhv.backend.domain.model.port.PortId;
import org.springframework.stereotype.Component;

@Component
public class PortEntityMapper {

    public Port toDomain(PortEntity entity) {
        return Port.reconstruct(
                PortId.of(entity.getId()),
                entity.getName(),
                Coordinates.of(entity.getX(), entity.getY())
        );
    }

    public PortEntity toEntity(Port port) {
        PortEntity entity = new PortEntity();
        entity.setId(port.getId().getValue());
        entity.setName(port.getName());
        entity.setX(port.getCoordinates().getX());
        entity.setY(port.getCoordinates().getY());
        return entity;
    }
}
