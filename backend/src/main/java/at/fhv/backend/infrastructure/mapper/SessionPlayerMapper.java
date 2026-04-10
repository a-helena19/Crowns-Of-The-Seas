package at.fhv.backend.infrastructure.mapper;

import at.fhv.backend.domain.model.player.ISessionPlayer;
import at.fhv.backend.domain.model.player.PlayerFaction;
import at.fhv.backend.infrastructure.persistence.player.SessionPlayerEntity;

public interface SessionPlayerMapper {
    ISessionPlayer toDomain(SessionPlayerEntity entity);
    SessionPlayerEntity toEntity(ISessionPlayer player, PlayerFaction faction);
}
