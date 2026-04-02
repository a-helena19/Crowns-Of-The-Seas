package at.fhv.backend.application.dtos.mapper.session;

import at.fhv.backend.domain.model.player.ISessionPlayer;
import at.fhv.backend.domain.model.player.PlayerFaction;
import at.fhv.backend.domain.model.session.GameSession;
import at.fhv.backend.rest.dtos.session.response.SessionDTO;
import at.fhv.backend.rest.dtos.session.response.SessionPlayerDTO;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class SessionDTOMapperImpl implements SessionDTOMapper {
    @Override
    public SessionPlayerDTO playerToDTO(ISessionPlayer player, PlayerFaction faction) {
        return new SessionPlayerDTO(
                player.getId(),
                player.getUserId(),
                player.getPlayerName(),
                player.isHost(),
                faction.name()
        );
    }

    @Override
    public SessionDTO sessionToDTO(GameSession session) {
        List<SessionPlayerDTO> playerDTOs = session.getPlayers().stream()
                .map(p -> playerToDTO(
                        p, session.getPlayerFactions().get(p.getUserId())))
                .toList();

        return new SessionDTO(
                session.getId(),
                session.getGameCode(),
                session.getStatus().name(),
                session.getMaxPlayers(),
                session.getTickRateSeconds(),
                playerDTOs
        );
    }
}
