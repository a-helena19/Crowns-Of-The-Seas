package at.fhv.backend.infrastructure.persistence.ship;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface ShipJpaRepository extends JpaRepository<ShipEntity, UUID> {
    @Query("SELECT s FROM ShipEntity s WHERE s.id NOT IN " +
            "(SELECT ps.shipId FROM PlayerShipEntity ps)")
    List<ShipEntity> findAllAvailableOnMarket();
}
