package at.fhv.backend.application.services.impl.leaderboard;

import at.fhv.backend.application.services.leaderboard.LeaderboardQueryService;
import at.fhv.backend.application.services.ship.ShipValuationService;
import at.fhv.backend.domain.model.exception.ShipNotFoundException;
import at.fhv.backend.domain.model.player.ISessionPlayer;
import at.fhv.backend.domain.model.player.SessionPlayerRepository;
import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.PlayerShipRepository;
import at.fhv.backend.domain.model.ship.Ship;
import at.fhv.backend.domain.model.ship.ShipRepository;
import at.fhv.backend.rest.dtos.leaderboard.response.LeaderboardEntryDTO;
import at.fhv.backend.rest.dtos.leaderboard.response.LeaderboardEntryValueDTO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class LeaderboardQueryServiceImpl implements LeaderboardQueryService {

    private final SessionPlayerRepository sessionPlayerRepository;
    private final PlayerShipRepository playerShipRepository;
    private final ShipRepository shipRepository;
    private final ShipValuationService shipValuationService;

    public LeaderboardQueryServiceImpl(
            SessionPlayerRepository sessionPlayerRepository,
            PlayerShipRepository playerShipRepository,
            ShipRepository shipRepository,
            ShipValuationService shipValuationService
    ) {
        this.sessionPlayerRepository = sessionPlayerRepository;
        this.playerShipRepository = playerShipRepository;
        this.shipRepository = shipRepository;
        this.shipValuationService = shipValuationService;
    }

    @Override
    public List<LeaderboardEntryDTO> getLeaderboard(UUID sessionId) {
        List<ISessionPlayer> players = sessionPlayerRepository.findAllBySessionId(sessionId);

        List<LeaderboardEntryValueDTO> values = new ArrayList<>();

        for (ISessionPlayer player : players) {
            List<PlayerShip> ships = playerShipRepository.findAllByPlayerIdAndSessionId(player.getUserId(), sessionId);

            BigDecimal shipsValue = BigDecimal.ZERO;

            for (PlayerShip ps : ships) {
                Ship ship = shipRepository.findById(ps.getShipId())
                        .orElseThrow(() -> new ShipNotFoundException("shipId", ps.getShipId()));
                BigDecimal currentShipValue = shipValuationService.calculateCurrentShipValue(ship, ps);
                shipsValue = shipsValue.add(currentShipValue);
            }

            BigDecimal totalValue = player.getBalance().add(shipsValue);

            values.add(new LeaderboardEntryValueDTO(
                    player.getUserId(),
                    player.getPlayerName(),
                    player.getBalance(),
                    shipsValue,
                    totalValue,
                    ships.size()
            ));
        }

        values.sort(Comparator.comparing(LeaderboardEntryValueDTO::totalValue).reversed()
                .thenComparing(LeaderboardEntryValueDTO::playerName));

        return mapWithCompetitionRanks(values);
    }

    private List<LeaderboardEntryDTO> mapWithCompetitionRanks(List<LeaderboardEntryValueDTO> sortedValues) {
        List<LeaderboardEntryDTO> ranked = new ArrayList<>();

        int rank = 0;
        int index = 0;
        BigDecimal lastValue = null;

        for (LeaderboardEntryValueDTO v : sortedValues) {
            index++;
            if (lastValue == null || v.totalValue().compareTo(lastValue) != 0) {
                rank = index;
                lastValue = v.totalValue();
            }

            ranked.add(new LeaderboardEntryDTO(
                    rank,
                    v.playerId(),
                    v.playerName(),
                    v.cash(),
                    v.shipsValue(),
                    v.totalValue(),
                    v.shipCount()
            ));
        }

        return ranked;
    }
}
