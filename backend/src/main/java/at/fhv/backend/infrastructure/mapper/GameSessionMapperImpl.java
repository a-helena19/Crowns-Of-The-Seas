package at.fhv.backend.infrastructure.mapper;

import at.fhv.backend.domain.model.player.ISessionPlayer;
import at.fhv.backend.domain.model.player.PlayerFaction;
import at.fhv.backend.domain.model.session.GameSession;
import at.fhv.backend.domain.model.session.SessionStatus;
import at.fhv.backend.infrastructure.persistence.player.SessionPlayerEntity;
import at.fhv.backend.infrastructure.persistence.session.GameSessionEntity;
import at.fhv.backend.infrastructure.persistence.session.SessionStatusEntity;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class GameSessionMapperImpl implements GameSessionMapper {

    private final SessionPlayerMapper sessionPlayerMapper;

    public GameSessionMapperImpl(SessionPlayerMapper sessionPlayerMapper) {
        this.sessionPlayerMapper = sessionPlayerMapper;
    }

    @Override
    public GameSession toDomain(GameSessionEntity entity) {
        List<ISessionPlayer> players = entity.getPlayers()
                .stream()
                .map(sessionPlayerMapper::toDomain)
                .collect(Collectors.toCollection(ArrayList::new));

        Map<UUID, PlayerFaction> factions = entity.getPlayers()
                .stream()
                .filter(p -> p.getFaction() != null)
                .collect(Collectors.toMap(
                        SessionPlayerEntity::getUserId,
                        SessionPlayerEntity::getFaction
                ));

        Map<UUID, Boolean> readyStatus = entity.getPlayers()
                .stream()
                .filter(p -> p.isReady())
                .collect(Collectors.toMap(
                        SessionPlayerEntity::getUserId,
                        p -> true
                ));

        GameSession session = GameSession.reconstruct(
                entity.getId(),
                SessionStatus.valueOf(entity.getStatus().name()),
                entity.getHostUserId(),
                entity.getMaxPlayers(),
                entity.getCurrentTick(),
                entity.getTickRateSeconds(),
                entity.getTotalTicks(),
                entity.getGameCode(),
                players,
                factions,
                entity.getStartTime(),
                entity.getDuration()
        );

        session.setReadyStatus(readyStatus);

        return session;

    }

    @Override
    public GameSessionEntity toEntity(GameSession domain) {
        GameSessionEntity entity = new GameSessionEntity();
        entity.setId(domain.getId());
        entity.setStatus(SessionStatusEntity.valueOf(domain.getStatus().name()));
        entity.setHostUserId(domain.getHostUserId());
        entity.setMaxPlayers(domain.getMaxPlayers());
        entity.setCurrentTick(domain.getCurrentTick());
        entity.setTickRateSeconds(domain.getTickRateSeconds());
        entity.setTotalTicks(domain.getTotalTicks());
        entity.setGameCode(domain.getGameCode());
        entity.setStartTime(domain.getStartTime());
        entity.setDuration(domain.getDuration());

        List<SessionPlayerEntity> playerEntities = domain.getPlayers()
                .stream()
                .map(p -> {
                    SessionPlayerEntity playerEntity = sessionPlayerMapper.toEntity(
                            p, domain.getPlayerFactions().get(p.getUserId()));

                    boolean isReady = domain.getReadyPlayers().contains(p.getUserId());
                    playerEntity.setReady(isReady);

                    return playerEntity;
                })
                .toList();
        entity.setPlayers(playerEntities);

        return entity;
    }
}
