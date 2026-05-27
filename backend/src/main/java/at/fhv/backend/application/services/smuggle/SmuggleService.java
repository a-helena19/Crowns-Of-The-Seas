package at.fhv.backend.application.services.smuggle;

import at.fhv.backend.domain.model.smuggle.SmuggleOffer;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface SmuggleService {
    boolean tryGenerateSmuggleOfferBeforeDeparture(UUID playerId, UUID sessionId, UUID portId,
                                                   UUID travelId, UUID playerShipId);

    void acceptSmuggleOffer(UUID playerId, UUID sessionId, UUID offerId);

    void declineSmuggleOffer(UUID playerId, UUID offerId);
    SmuggleOffer getAcceptedOfferForTravel(UUID travelId);

    void clearAcceptedOfferForTravel(UUID travelId);

    List<SmuggleOffer> getPendingOffersForPlayer(UUID playerId);
}