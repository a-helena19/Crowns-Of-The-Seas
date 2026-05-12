package at.fhv.backend.infrastructure.mapper;

import at.fhv.backend.domain.model.player.BaseSessionPlayer;
import at.fhv.backend.domain.model.player.ISessionPlayer;
import at.fhv.backend.domain.model.player.PlayerFaction;
import at.fhv.backend.domain.model.player.decorator.FactionDecoratorFactory;
import at.fhv.backend.infrastructure.persistence.player.SessionPlayerEntity;
import org.springframework.stereotype.Component;

@Component
public class SessionPlayerMapperImpl implements SessionPlayerMapper {

    @Override
    public ISessionPlayer toDomain(SessionPlayerEntity entity) {
        ISessionPlayer player = BaseSessionPlayer.reconstruct(
                entity.getId(),
                entity.getUserId(),
                entity.getSessionId(),
                entity.getPlayerName(),
                entity.isHost(),
                entity.getBalance(),
                entity.getFaction()
        );

        return FactionDecoratorFactory.createDecoratedPlayer(player, entity.getFaction());
    }

    @Override
    public SessionPlayerEntity toEntity(ISessionPlayer player, PlayerFaction faction) {
        SessionPlayerEntity entity = new SessionPlayerEntity();
        entity.setId(player.getId());
        entity.setUserId(player.getUserId());
        entity.setSessionId(player.getSessionId());
        entity.setPlayerName(player.getPlayerName());
        entity.setHost(player.isHost());
        entity.setBalance(player.getBalance());
        entity.setFaction(faction);
        return entity;
    }
}