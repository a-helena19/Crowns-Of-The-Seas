package at.fhv.backend.infrastructure.persistence.port;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PortJpaRepository extends JpaRepository<PortEntity, UUID> {
}
