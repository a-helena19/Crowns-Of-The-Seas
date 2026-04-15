package at.fhv.backend.application.dtos.mapper.session;

import at.fhv.backend.domain.model.player.ISessionPlayer;
import at.fhv.backend.domain.model.player.PlayerFaction;
import at.fhv.backend.domain.model.session.GameSession;
import at.fhv.backend.rest.dtos.session.response.SessionDTO;
import at.fhv.backend.rest.dtos.session.response.SessionPlayerDTO;

public interface SessionDTOMapper {
    SessionPlayerDTO playerToDTO(ISessionPlayer player, PlayerFaction faction);
    SessionDTO sessionToDTO(GameSession session);
}
