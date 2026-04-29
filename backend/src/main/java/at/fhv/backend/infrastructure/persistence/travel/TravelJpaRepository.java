package at.fhv.backend.infrastructure.persistence.travel;

import at.fhv.backend.domain.model.travel.TravelStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TravelJpaRepository extends JpaRepository<TravelEntity, UUID> {
    List<TravelEntity> findAllByPlayerIdAndTravelStatus(UUID playerId, TravelStatus travelStatus);
    List<TravelEntity> findAllByTravelStatus(TravelStatus travelStatus);
    @Query("SELECT t FROM TravelEntity t " +
            "WHERE t.playerShipId = :playerShipId AND t.travelStatus = 'IN_PROGRESS'")
    Optional<TravelEntity> findActiveByPlayerShipId(@Param("playerShipId") UUID playerShipId);

    @Query("SELECT t FROM TravelEntity t " +
            "WHERE t.sessionId = :sessionId AND t.travelStatus = 'IN_PROGRESS'")
    List<TravelEntity> findAllInProgressBySessionId(@Param("sessionId") UUID sessionId);

    List<TravelEntity> findByTravelStatus(TravelStatus travelStatus);

    @Query("SELECT t FROM TravelEntity t " +
            "WHERE t.sessionId = :sessionId AND t.travelStatus = :status")
    List<TravelEntity> findAllBySessionIdAndStatus(@Param("sessionId") UUID sessionId,
                                                   @Param("status") TravelStatus status);
}
