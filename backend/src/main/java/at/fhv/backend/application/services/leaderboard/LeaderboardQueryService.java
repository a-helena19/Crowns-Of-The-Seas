package at.fhv.backend.application.services.leaderboard;

import at.fhv.backend.rest.dtos.leaderboard.response.LeaderboardEntryDTO;

import java.util.List;
import java.util.UUID;

public interface LeaderboardQueryService {
    List<LeaderboardEntryDTO> getLeaderboard(UUID sessionId);
}
