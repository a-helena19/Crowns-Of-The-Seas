package at.fhv.backend.infrastructure.persistence.session;

import at.fhv.backend.infrastructure.persistence.player.SessionPlayerEntity;
import jakarta.persistence.*;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "game_sessions")
public class GameSessionEntity {

    @Id
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionStatusEntity status;

    @Column(nullable = false)
    private UUID hostUserId;

    @Column(nullable = false)
    private int maxPlayers;

    @Column(nullable = false)
    private int currentTick;

    @Column(nullable = false)
    private int tickRateSeconds;

    @Column(nullable = false, columnDefinition = "int default 0")
    private int totalTicks;

    @Column(nullable = false, unique = true)
    private String gameCode;

    @Column
    private LocalDateTime startTime;

    @Column(nullable = false)
    private Duration duration;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SessionPlayerEntity> players = new ArrayList<>();

    public GameSessionEntity() {}

    public GameSessionEntity(SessionStatusEntity status, UUID hostUserId, int maxPlayers, int currentTick, int tickRateSeconds, int totalTicks, String gameCode, LocalDateTime startTime, Duration duration) {
        this.status = status;
        this.hostUserId = hostUserId;
        this.maxPlayers = maxPlayers;
        this.currentTick = currentTick;
        this.tickRateSeconds = tickRateSeconds;
        this.totalTicks = totalTicks;
        this.gameCode = gameCode;
        this.startTime = startTime;
        this.duration = duration;
    }

    public UUID getId() {
        return id;
    }

    public SessionStatusEntity getStatus() {
        return status;
    }

    public UUID getHostUserId() {
        return hostUserId;
    }

    public int getMaxPlayers() {
        return maxPlayers;
    }

    public int getCurrentTick() {
        return currentTick;
    }

    public int getTickRateSeconds() {
        return tickRateSeconds;
    }

    public int getTotalTicks() {
        return totalTicks;
    }

    public String getGameCode() {
        return gameCode;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public Duration getDuration() {
        return duration;
    }

    public List<SessionPlayerEntity> getPlayers() {
        return players;
    }

    public void setId(UUID id) {
        this.id = id;
    }
    public void setStatus(SessionStatusEntity status) {
        this.status = status;
    }
    public void setHostUserId(UUID hostUserId) {
        this.hostUserId = hostUserId;
    }
    public void setMaxPlayers(int maxPlayers) {
        this.maxPlayers = maxPlayers;
    }

    public void setCurrentTick(int currentTick) {
        this.currentTick = currentTick;
    }

    public void setTickRateSeconds(int tickRateSeconds) {
        this.tickRateSeconds = tickRateSeconds;
    }

    public void setTotalTicks(int totalTicks) {
        this.totalTicks = totalTicks;
    }

    public void setGameCode(String gameCode) {
        this.gameCode = gameCode;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public void setDuration(Duration duration) {
        this.duration = duration;
    }

    public void setPlayers(List<SessionPlayerEntity> players) {
        this.players = players;
    }
}