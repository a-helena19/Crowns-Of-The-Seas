package at.fhv.backend.application.services.smuggle;

import at.fhv.backend.domain.model.smuggle.SmuggleOffer;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface SmuggleService {
    void tryGenerateSmuggleOffer(UUID playerId, UUID sessionId, UUID portId);
    void acceptSmuggleOffer(UUID playerId, UUID sessionId, UUID offerId);
    void declineSmuggleOffer(UUID playerId, UUID offerId);
    SmuggleOffer getAcceptedOffer(UUID playerId);
    List<SmuggleOffer> getAllAcceptedOffers(UUID playerId);
    void clearAcceptedOffer(UUID playerId);
}