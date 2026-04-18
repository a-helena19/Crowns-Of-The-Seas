package at.fhv.backend.infrastructure.persistence.cargo;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CargoJpaRepository extends JpaRepository<CargoEntity, UUID> {}
