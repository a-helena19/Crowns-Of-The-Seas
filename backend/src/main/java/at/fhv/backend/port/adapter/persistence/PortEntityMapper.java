package at.fhv.backend.port.adapter.persistence;

import at.fhv.backend.port.domain.model.Coordinates;
import at.fhv.backend.port.domain.model.Port;
import at.fhv.backend.port.domain.model.PortId;
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
