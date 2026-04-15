package at.fhv.backend.port.adapter.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PortJpaRepository extends JpaRepository<PortEntity, UUID> {
}
