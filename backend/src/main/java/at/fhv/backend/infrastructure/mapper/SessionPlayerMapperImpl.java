package at.fhv.backend.infrastructure.mapper;

import at.fhv.backend.domain.model.player.BaseSessionPlayer;
import at.fhv.backend.domain.model.player.ISessionPlayer;
import at.fhv.backend.domain.model.player.PlayerFaction;
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
                entity.getBalance()
        );

        return player;

        // TODO: implement faction decorators and remove this comment in sprint 2
        /*
        if (entity.getFaction() == null) return player;

        return switch (entity.getFaction()) {
            case ENGINEERS      -> new EngineerDecorator(player);
            case REFINERIES     -> new RefineryDecorator(player);
            case HARBOR_MASTERS -> new HarborMasterDecorator(player);
            case SMUGGLERS      -> new SmugglerDecorator(player);
            case SCOUTS         -> new ScoutDecorator(player);
            case TRADERS        -> new TraderDecorator(player);
            case QUICK_SERVICE  -> new QuickServiceDecorator(player);
        };

         */
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
