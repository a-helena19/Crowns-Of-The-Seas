package at.fhv.backend.rest.dtos.leaderboard.response;

import java.math.BigDecimal;
import java.util.UUID;

public record LeaderboardEntryValueDTO (
        UUID playerId,
        String playerName,
        BigDecimal cash,
        BigDecimal shipsValue,
        BigDecimal totalValue,
        int shipCount
){}
