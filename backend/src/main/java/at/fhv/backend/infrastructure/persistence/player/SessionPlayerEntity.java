package at.fhv.backend.infrastructure.persistence.player;

import at.fhv.backend.domain.model.player.PlayerFaction;
import at.fhv.backend.infrastructure.persistence.session.GameSessionEntity;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "session_players")
public class SessionPlayerEntity {
    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @Column(name = "player_name", nullable = false)
    private String playerName;

    @Column(name = "is_host", nullable = false)
    private boolean isHost;

    @Column(name = "balance", nullable = false)
    private BigDecimal balance;

    @Column(name = "is_ready", nullable = false, columnDefinition = "boolean default false")
    private boolean isReady;

    @Enumerated(EnumType.STRING)
    @Column(name = "faction")
    private PlayerFaction faction;

    @Column(name = "home_port_id")
    private UUID homePortId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", insertable = false, updatable = false)
    private GameSessionEntity session;

    public SessionPlayerEntity() {}

    public SessionPlayerEntity(UUID userId, UUID sessionId, String playerName, boolean isHost,
                               BigDecimal balance, boolean isReady, PlayerFaction faction, UUID homePortId) {
        this.userId = userId;
        this.sessionId = sessionId;
        this.playerName = playerName;
        this.isHost = isHost;
        this.faction = faction;
        this.balance = balance;
        this.isReady = isReady;
        this.homePortId = homePortId;
    }

    public UUID getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public UUID getSessionId() {
        return sessionId;
    }

    public String getPlayerName() {
        return playerName;
    }

    public boolean isHost() {
        return isHost;
    }

    public BigDecimal getBalance() {
        return balance;
    }

    public boolean isReady() {
        return isReady;
    }

    public PlayerFaction getFaction() {
        return faction;
    }

    public GameSessionEntity getSession() {
        return session;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public void setSessionId(UUID sessionId) {
        this.sessionId = sessionId;
    }

    public void setPlayerName(String playerName) {
        this.playerName = playerName;
    }

    public void setHost(boolean host) {
        isHost = host;
    }

    public void setBalance(BigDecimal balance) {
        this.balance = balance;
    }

    public void setReady(boolean ready) {
        isReady = ready;
    }

    public void setFaction(PlayerFaction faction) {
        this.faction = faction;
    }

    public UUID getHomePortId() {
        return homePortId;
    }

    public void setHomePortId(UUID homePortId) {
        this.homePortId = homePortId;
    }

    public void setSession(GameSessionEntity session) {
        this.session = session;
    }

}
