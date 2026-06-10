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
import java.util.Set;
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

        Map<UUID, UUID> homePorts = entity.getPlayers()
                .stream()
                .filter(p -> p.getHomePortId() != null)
                .collect(Collectors.toMap(
                        SessionPlayerEntity::getUserId,
                        SessionPlayerEntity::getHomePortId
                ));

        Set<UUID> disconnected = entity.getPlayers()
                .stream()
                .filter(SessionPlayerEntity::isDisconnected)
                .map(SessionPlayerEntity::getUserId)
                .collect(Collectors.toSet());

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
                homePorts,
                entity.getStartTime(),
                entity.getDuration()
        );

        session.setReadyStatus(readyStatus);
        session.setDisconnectedPlayers(disconnected);

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
                    playerEntity.setDisconnected(domain.isPlayerDisconnected(p.getUserId()));
                    // Keep both sides of the bidirectional relation in sync so JPA reliably persists all players.
                    playerEntity.setSession(entity);

                    UUID homePortId = domain.getPlayerHomePorts().get(p.getUserId());
                    playerEntity.setHomePortId(homePortId);

                    return playerEntity;
                })
                .collect(Collectors.toCollection(ArrayList::new));
        entity.setPlayers(playerEntities);

        return entity;
    }
}