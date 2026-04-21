package at.fhv.backend.domain.model.session;

import at.fhv.backend.domain.model.player.ISessionPlayer;
import at.fhv.backend.domain.model.player.PlayerFaction;
import at.fhv.backend.domain.model.session.exception.*;
import at.fhv.backend.domain.model.player.exception.*;


import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

public class GameSession {

    private final UUID id;
    private SessionStatus status;
    private UUID hostUserId;
    private final int maxPlayers;
    private int currentTick;
    private int tickRateSeconds;
    private final int totalTicks;
    private final String gameCode;
    private final List<ISessionPlayer> players;
    private final Map<UUID, PlayerFaction> playerFactions;
    private LocalDateTime startTime;
    private final Duration duration;

    public GameSession(UUID hostUserId, int maxPlayers, int tickRateSeconds, int totalTicks, Duration duration) {
        this.id = UUID.randomUUID();
        this.status = SessionStatus.LOBBY;
        this.hostUserId = hostUserId;
        this.maxPlayers = maxPlayers;
        this.currentTick = 0;
        this.tickRateSeconds = tickRateSeconds;
        this.totalTicks = totalTicks;
        this.gameCode = generateCode();
        this.players = new ArrayList<>();
        this.playerFactions = new HashMap<>();
        this.duration = duration;
    }

    public static GameSession reconstruct(UUID id, SessionStatus status,
                                          UUID hostUserId, int maxPlayers,
                                          int currentTick, int tickRateSeconds,
                                          int totalTicks, String gameCode,
                                          List<ISessionPlayer> players,
                                          Map<UUID, PlayerFaction> factions,
                                          LocalDateTime startTime,
                                          Duration duration) {
        return new GameSession(id, status, hostUserId, maxPlayers,
                currentTick, tickRateSeconds, totalTicks, gameCode,
                players, factions, startTime, duration);
    }

    private GameSession(UUID id, SessionStatus status, UUID hostUserId,
                        int maxPlayers, int currentTick, int tickRateSeconds,
                        int totalTicks, String gameCode, List<ISessionPlayer> players,
                        Map<UUID, PlayerFaction> factions, LocalDateTime startTime, Duration duration) {
        this.id = id;
        this.status = status;
        this.hostUserId = hostUserId;
        this.maxPlayers = maxPlayers;
        this.currentTick = currentTick;
        this.tickRateSeconds = tickRateSeconds;
        this.totalTicks = totalTicks;
        this.gameCode = gameCode;
        this.players = players;
        this.playerFactions = factions;
        this.startTime = startTime;
        this.duration = duration;
    }

    public void addPlayer(ISessionPlayer player) {
        if (status != SessionStatus.LOBBY)
            throw new SessionNotInLobbyException(id);
        if (players.size() >= maxPlayers)
            throw new SessionFullException(id);
        // Check if player already in session
        if (players.stream().anyMatch(p -> p.getUserId().equals(player.getUserId())))
            throw new PlayerAlreadyInSessionException(id, player.getUserId());
        players.add(player);
    }

    public void start(UUID requestingUserId) {
        if (!requestingUserId.equals(hostUserId))
            throw new OnlyHostCanStartException(requestingUserId);
        if (!status.canTransitionTo(SessionStatus.RUNNING))
            throw new SessionNotInLobbyException(id);
        this.status = SessionStatus.RUNNING;
        this.startTime = LocalDateTime.now();
    }

    public void changeTickRate(UUID requestingUserId, int tickRateSeconds) {
        if (!requestingUserId.equals(hostUserId))
            throw new OnlyHostCanStartException(requestingUserId);
        if (status != SessionStatus.LOBBY)
            throw new SessionNotInLobbyException(id);
        if (tickRateSeconds < 1 || tickRateSeconds > 60)
            throw new InvalidTickRateException(tickRateSeconds);
        this.tickRateSeconds = tickRateSeconds;
    }

    public void removePlayer(UUID userId) {
        if (status != SessionStatus.LOBBY)
            throw new SessionNotInLobbyException(id);
        boolean removed = players.removeIf(p -> p.getUserId().equals(userId));
        if (!removed)
            throw new PlayerNotFoundException(userId);
        playerFactions.remove(userId);
    }

    public void makePlayerHost(UUID userId) {
        for (ISessionPlayer player : this.players) {
            if (player.getUserId().equals(userId)) {
                this.hostUserId = userId;
                return;
            }
        }
    }

    // TODO: assignPlayerFaction in sprint2
    /*
    public void assignPlayerFaction(UUID userId, PlayerFaction faction) {
        boolean exists = players.stream()
                .anyMatch(p -> p.getUserId().equals(userId));
        if (!exists)
            throw new PlayerNotFoundException(userId);
        if (playerFactions.containsKey(userId))
            throw new FactionAlreadyAssignedException(userId);
        playerFactions.put(userId, faction);
    }

     */

    public void tick() {
        if (status != SessionStatus.RUNNING) return;
        currentTick++;
    }

    public void finish() {
        if (!status.canTransitionTo(SessionStatus.FINISHED))
            throw new SessionNotRunningException(id);
        this.status = SessionStatus.FINISHED;
    }

    public boolean isExpired() {
        return currentTick >= totalTicks;
    }

    private String generateCode() {
        return UUID.randomUUID().toString()
                .substring(0, 6).toUpperCase();
    }

    public UUID getId(){
        return id;
    }
    public SessionStatus getStatus(){
        return status;
    }
    public UUID getHostUserId(){
        return hostUserId;
    }
    public int getMaxPlayers(){
        return maxPlayers;
    }
    public int getCurrentTick(){
        return currentTick;
    }
    public int getTickRateSeconds(){
        return tickRateSeconds;
    }
    public int getTotalTicks(){
        return totalTicks;
    }
    public String getGameCode(){
        return gameCode;
    }
    public List<ISessionPlayer> getPlayers(){
        return Collections.unmodifiableList(players);
    }
    public Map<UUID, PlayerFaction> getPlayerFactions(){
        return Collections.unmodifiableMap(playerFactions);
    }
    public LocalDateTime getStartTime(){
        return startTime;
    }

    public Duration getDuration(){
        return duration;
    }
}