package at.fhv.backend.application.services.impl.smuggle;

import at.fhv.backend.application.services.smuggle.SmuggleService;
import at.fhv.backend.application.services.travel.PendingTravelStartService;
import at.fhv.backend.domain.model.cargo.CargoStatus;
import at.fhv.backend.domain.model.cargo.SessionCargo;
import at.fhv.backend.domain.model.cargo.SessionCargoRepository;
import at.fhv.backend.domain.model.player.ISessionPlayer;
import at.fhv.backend.domain.model.player.SessionPlayerRepository;
import at.fhv.backend.domain.model.player.exception.PlayerNotFoundException;
import at.fhv.backend.domain.model.smuggle.SmuggleOffer;
import at.fhv.backend.domain.model.smuggle.SmuggleOfferStatus;
import at.fhv.backend.domain.model.smuggle.SmuggleType;
import at.fhv.backend.domain.model.smuggle.exception.SmuggleOfferExpiredException;
import at.fhv.backend.domain.model.smuggle.exception.SmuggleOfferNotFoundException;
import at.fhv.backend.rest.GameSessionWebSocketController;
import at.fhv.backend.rest.dtos.websocket.SmuggleOfferEvent;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SmuggleServiceImpl implements SmuggleService {

    private static final double BASE_SMUGGLE_CHANCE = 0.55;
    private static final int MIN_REWARD = 5000;
    private static final int MAX_REWARD = 40000;
    private static final int REWARD_STEP = 1000;

    private final SessionPlayerRepository sessionPlayerRepository;
    private final SessionCargoRepository sessionCargoRepository;
    private final GameSessionWebSocketController webSocketController;
    private final PendingTravelStartService pendingTravelStartService;
    private final Map<UUID, SmuggleOffer> activeOffers = new ConcurrentHashMap<>();
    private final Map<UUID, SmuggleOffer> acceptedOffersByTravelId = new ConcurrentHashMap<>();

    private final Random random = new Random();

    public SmuggleServiceImpl(SessionPlayerRepository sessionPlayerRepository,
                              SessionCargoRepository sessionCargoRepository,
                              GameSessionWebSocketController webSocketController,
                              PendingTravelStartService pendingTravelStartService) {
        this.sessionPlayerRepository = sessionPlayerRepository;
        this.sessionCargoRepository = sessionCargoRepository;
        this.webSocketController = webSocketController;
        this.pendingTravelStartService = pendingTravelStartService;
    }

    @Override
    public boolean tryGenerateSmuggleOfferBeforeDeparture(UUID playerId, UUID sessionId, UUID portId,
                                                          UUID travelId, UUID playerShipId) {
        ISessionPlayer player = sessionPlayerRepository.findByUserIdAndSessionId(playerId, sessionId)
                .orElseThrow(() -> new PlayerNotFoundException(playerId));

        double smuggleModifier = player.getSmuggleRiskModifier();
        double chance = BASE_SMUGGLE_CHANCE * smuggleModifier;
        double roll = random.nextDouble();

        if (roll >= chance) {
            return false;
        }

        BigDecimal reward = calculateReward();
        SmuggleType[] types = SmuggleType.values();
        SmuggleType smuggleType = types[random.nextInt(types.length)];

        SmuggleOffer offer = new SmuggleOffer(playerId, sessionId, portId, travelId, playerShipId,
                reward, smuggleType);
        activeOffers.put(offer.getId(), offer);

        SmuggleOfferEvent event = new SmuggleOfferEvent(
                offer.getId().toString(),
                playerId.toString(),
                portId.toString(),
                travelId.toString(),
                playerShipId.toString(),
                offer.getReward(),
                offer.getCargoDescription()
        );
        webSocketController.broadcastSmuggleOffer(sessionId.toString(), event);

        System.out.println("[Smuggle] Offer generated for player " + playerId
                + " at port " + portId
                + " for travel " + travelId
                + " — reward: " + reward + " T"
                + " — travel stays PLANNED until decision"
                + " (chance was " + String.format("%.2f", chance * 100) + "%)");
        return true;
    }

    @Override
    @Transactional
    public void acceptSmuggleOffer(UUID playerId, UUID sessionId, UUID offerId) {
        SmuggleOffer offer = activeOffers.get(offerId);
        if (offer == null) {
            throw new SmuggleOfferNotFoundException(offerId);
        }
        if (offer.getStatus() != SmuggleOfferStatus.PENDING) {
            throw new SmuggleOfferExpiredException(offerId);
        }

        offer.accept();
        markIllegalForThisTravel(offer);

        acceptedOffersByTravelId.put(offer.getTravelId(), offer);
        activeOffers.remove(offerId);

        pendingTravelStartService.finalizePlannedTravel(offer.getTravelId());

        System.out.println("[Smuggle] Player " + playerId + " accepted smuggle offer "
                + offerId + " for travel " + offer.getTravelId()
                + " — reward pending: " + offer.getReward() + " T");
    }

    @Override
    @Transactional
    public void declineSmuggleOffer(UUID playerId, UUID offerId) {
        SmuggleOffer offer = activeOffers.get(offerId);
        if (offer == null) {
            return;
        }

        offer.decline();
        activeOffers.remove(offerId);
        pendingTravelStartService.finalizePlannedTravel(offer.getTravelId());

        System.out.println("[Smuggle] Player " + playerId + " declined smuggle offer "
                + offerId + " for travel " + offer.getTravelId());
    }

    @Override
    public SmuggleOffer getAcceptedOfferForTravel(UUID travelId) {
        return acceptedOffersByTravelId.get(travelId);
    }

    @Override
    public void clearAcceptedOfferForTravel(UUID travelId) {
        acceptedOffersByTravelId.remove(travelId);
    }

    @Override
    public List<SmuggleOffer> getPendingOffersForPlayer(UUID playerId) {
        List<SmuggleOffer> result = new ArrayList<>();
        for (SmuggleOffer offer : activeOffers.values()) {
            if (offer.getPlayerId().equals(playerId)) {
                result.add(offer);
            }
        }
        return result;
    }

    private void markIllegalForThisTravel(SmuggleOffer offer) {
        List<SessionCargo> playerCargos = sessionCargoRepository.findByAssignedPlayerId(offer.getPlayerId());
        int marked = 0;
        for (SessionCargo cargo : playerCargos) {
            boolean isForThisShip = cargo.getAssignedPlayerShipId() != null
                    && cargo.getAssignedPlayerShipId().equals(offer.getPlayerShipId());
            boolean isAssigned = cargo.getCargoStatus() == CargoStatus.ASSIGNED;
            if (isForThisShip && isAssigned) {
                cargo.markAsIllegal();
                sessionCargoRepository.save(cargo);
                marked++;
            }
        }
        System.out.println("[Smuggle] Marked " + marked + " cargo(s) as illegal for travel "
                + offer.getTravelId() + " (ship " + offer.getPlayerShipId() + ")");
    }

    private BigDecimal calculateReward() {
        int steps = (MAX_REWARD - MIN_REWARD) / REWARD_STEP;
        int randomSteps = random.nextInt(steps + 1);
        int reward = MIN_REWARD + (randomSteps * REWARD_STEP);
        return BigDecimal.valueOf(reward);
    }
}