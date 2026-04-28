package at.fhv.backend.domain.model.travel;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TravelRepository {
    Travel save(Travel travel);
    Optional<Travel> findById(UUID travelId);
    List<Travel> findAllByPlayerIdAndStatus(UUID playerId, TravelStatus status);
    Optional<Travel> findActiveByPlayerShipId(UUID playerShipId);
    List<Travel> findAllInProgress();
    List<Travel> findAllInProgressBySessionId(UUID sessionId);

    List<Travel> findByStatus(TravelStatus travelStatus);
}
