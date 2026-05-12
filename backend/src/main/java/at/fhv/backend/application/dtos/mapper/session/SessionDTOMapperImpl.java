package at.fhv.backend.application.dtos.mapper.session;

import at.fhv.backend.domain.model.player.ISessionPlayer;
import at.fhv.backend.domain.model.player.PlayerFaction;
import at.fhv.backend.domain.model.session.GameSession;
import at.fhv.backend.rest.dtos.session.response.SessionDTO;
import at.fhv.backend.rest.dtos.session.response.SessionPlayerDTO;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class SessionDTOMapperImpl implements SessionDTOMapper {
    @Override
    public SessionPlayerDTO playerToDTO(ISessionPlayer player, PlayerFaction faction) {
        return new SessionPlayerDTO(
                player.getId(),
                player.getUserId(),
                player.getPlayerName(),
                player.isHost(),
                faction != null ? faction.name() : null,
                player.getHomePortId()
        );
    }

    @Override
    public SessionDTO sessionToDTO(GameSession session) {
        List<SessionPlayerDTO> playerDTOs = session.getPlayers().stream()
                .map(p -> {
                    PlayerFaction faction = session.getPlayerFactions().get(p.getUserId());
                    UUID homePortId = session.getPlayerHomePorts().get(p.getUserId());
                    return new SessionPlayerDTO(
                            p.getId(),
                            p.getUserId(),
                            p.getPlayerName(),
                            p.isHost(),
                            faction != null ? faction.name() : null,
                            homePortId
                    );
                })
                .toList();

        return new SessionDTO(
                session.getId(),
                session.getGameCode(),
                session.getStatus().name(),
                session.getMaxPlayers(),
                session.getTickRateSeconds(),
                session.getTotalTicks(),
                session.getCurrentTick(),
                playerDTOs
        );
    }
}
