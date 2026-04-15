package at.fhv.backend.infrastructure.persistence.port;

import at.fhv.backend.domain.model.port.Port;
import at.fhv.backend.domain.model.port.PortId;
import at.fhv.backend.domain.model.port.PortRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public class PortRepositoryImpl implements PortRepository {

    private final PortJpaRepository portJpaRepository;
    private final PortEntityMapper portEntityMapper;

    public PortRepositoryImpl(PortJpaRepository portJpaRepository, PortEntityMapper portEntityMapper) {
        this.portJpaRepository = portJpaRepository;
        this.portEntityMapper = portEntityMapper;
    }

    @Override
    public Port save(Port port) {
        return portEntityMapper.toDomain(
                portJpaRepository.save(portEntityMapper.toEntity(port))
        );
    }

    @Override
    public Optional<Port> findById(PortId id) {
        return portJpaRepository.findById(id.getValue())
                .map(portEntityMapper::toDomain);
    }

    @Override
    public List<Port> findAll() {
        return portJpaRepository.findAll()
                .stream()
                .map(portEntityMapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public boolean existsById(PortId id) {
        return portJpaRepository.existsById(id.getValue());
    }
}
