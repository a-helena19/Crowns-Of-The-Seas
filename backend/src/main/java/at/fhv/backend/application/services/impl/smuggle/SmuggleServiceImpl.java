package at.fhv.backend.application.services.impl.smuggle;

import at.fhv.backend.application.services.smuggle.SmuggleService;
import at.fhv.backend.domain.model.cargo.CargoStatus;
import at.fhv.backend.domain.model.cargo.SessionCargo;
import at.fhv.backend.domain.model.cargo.SessionCargoRepository;
import at.fhv.backend.domain.model.session.GameSession;
import at.fhv.backend.domain.model.session.exception.SessionNotFoundException;
import at.fhv.backend.domain.model.smuggle.SmuggleOfferStatus;
import at.fhv.backend.domain.model.smuggle.SmuggleType;

import at.fhv.backend.domain.model.player.ISessionPlayer;
import at.fhv.backend.domain.model.player.SessionPlayerRepository;
import at.fhv.backend.domain.model.player.exception.PlayerNotFoundException;
import at.fhv.backend.domain.model.session.GameSessionRepository;
import at.fhv.backend.domain.model.smuggle.SmuggleOffer;
import at.fhv.backend.domain.model.smuggle.exception.SmuggleOfferExpiredException;
import at.fhv.backend.domain.model.smuggle.exception.SmuggleOfferNotFoundException;
import at.fhv.backend.rest.GameSessionWebSocketController;
import at.fhv.backend.rest.dtos.websocket.SmuggleOfferEvent;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SmuggleServiceImpl implements SmuggleService {
    private static final double BASE_SMUGGLE_CHANCE = 0.60;
    private static final int MIN_REWARD = 5000;
    private static final int MAX_REWARD = 40000;
    private static final int REWARD_STEP = 1000;

    private final SessionPlayerRepository sessionPlayerRepository;
    private final SessionCargoRepository sessionCargoRepository;
    private final GameSessionWebSocketController webSocketController;
    private final Map<UUID, SmuggleOffer> activeOffers = new ConcurrentHashMap<>();
    private final Map<UUID, SmuggleOffer> acceptedOffers = new ConcurrentHashMap<>();

    private final Random random = new Random();

    public SmuggleServiceImpl(SessionPlayerRepository sessionPlayerRepository, SessionCargoRepository sessionCargoRepository, GameSessionWebSocketController webSocketController) {
        this.sessionPlayerRepository = sessionPlayerRepository;
        this.sessionCargoRepository = sessionCargoRepository;
        this.webSocketController = webSocketController;
    }

    @Override
    public void tryGenerateSmuggleOffer(UUID playerId, UUID sessionId, UUID portId) {
        ISessionPlayer player = sessionPlayerRepository.findByUserIdAndSessionId(playerId, sessionId)
                .orElseThrow(() -> new PlayerNotFoundException(playerId));

        double smuggleModifier = player.getSmuggleRiskModifier();
        double chance = BASE_SMUGGLE_CHANCE * smuggleModifier;
        double roll = random.nextDouble();

        if (roll >= chance) {
            return;
        }

        BigDecimal reward = calculateReward();
        SmuggleType[] types = SmuggleType.values();
        SmuggleType smuggleType = types[random.nextInt(types.length)];

        SmuggleOffer offer = new SmuggleOffer(playerId, sessionId, portId, reward, smuggleType);
        activeOffers.put(offer.getId(), offer);

        SmuggleOfferEvent event = new SmuggleOfferEvent(
                offer.getId().toString(),
                playerId.toString(),
                portId.toString(),
                offer.getReward(),
                offer.getCargoDescription()
        );

        webSocketController.broadcastSmuggleOffer(sessionId.toString(), event);
        System.out.println("[Smuggle] Offer generated for player " + playerId
                + " at port " + portId
                + " — reward: " + reward + " T"
                + " (chance was " + String.format("%.2f", chance * 100) + "%)");
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

        List<SessionCargo> playerCargos = sessionCargoRepository.findByAssignedPlayerId(playerId);
        for (SessionCargo cargo : playerCargos) {
            if (cargo.getCargoStatus() == CargoStatus.ASSIGNED) {
                cargo.markAsIllegal();
                sessionCargoRepository.save(cargo);
            }
        }

        activeOffers.remove(offerId);
        acceptedOffers.put(playerId, offer);

        System.out.println("[Smuggle] Player " + playerId + " accepted smuggle offer "
                + offerId + " — reward pending: " + offer.getReward() + " T");
    }

    @Override
    public SmuggleOffer getAcceptedOffer(UUID playerId) {
        return acceptedOffers.get(playerId);
    }

    @Override
    public void clearAcceptedOffer(UUID playerId) {
        acceptedOffers.remove(playerId);
    }

    @Override
    public void declineSmuggleOffer(UUID playerId, UUID offerId) {
        SmuggleOffer offer = activeOffers.get(offerId);
        if (offer == null) {
            return;
        }

        offer.decline();
        activeOffers.remove(offerId);
        System.out.println("[Smuggle] Player " + playerId + " declined smuggle offer " + offerId);
    }

    private BigDecimal calculateReward() {
        int steps = (MAX_REWARD - MIN_REWARD) / REWARD_STEP;
        int randomSteps = random.nextInt(steps + 1);
        int reward = MIN_REWARD + (randomSteps * REWARD_STEP);
        return BigDecimal.valueOf(reward);
    }
}
