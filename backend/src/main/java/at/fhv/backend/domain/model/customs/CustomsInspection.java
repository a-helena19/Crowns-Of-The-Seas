package at.fhv.backend.domain.model.customs;

import at.fhv.backend.domain.model.customs.exception.CustomsInspectionInvalidStateException;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * A single customs inspection at the destination port at the end of a travel.
 *
 * <p>The inspection captures both the {@code finePaid} (Strafe, may be zero, base, or doubled)
 * AND the {@code bribePaid} (Bestechungssumme, also flows out of the player's balance).
 * Both are deducted from the player's balance directly in
 * {@link at.fhv.backend.application.services.impl.cargo.CustomsServiceImpl}, NOT via the
 * unloading reward subtraction. This guarantees the fine / bribe is actually paid even
 * if the cargo reward is zero (e.g. all cargo expired).
 */
public class CustomsInspection {
    private final UUID id;
    private final UUID playerId;
    private final UUID sessionId;
    private final UUID travelId;
    private final UUID playerShipId;
    private final UUID destinationPortId;
    private final String shipName;
    private final String originPortName;
    private final String destinationPortName;
    private final boolean carryingIllegalCargo;
    private final BigDecimal baseFine;
    private final BigDecimal bribeCost;
    private final int detentionTicks;

    private CustomsInspectionStatus status;
    private CustomsInspectionOutcome outcome;
    private BigDecimal finePaid;
    private BigDecimal bribePaid;
    private boolean bribeAttempted;

    public CustomsInspection(UUID playerId, UUID sessionId, UUID travelId, UUID playerShipId,
                             UUID destinationPortId, String shipName, String originPortName,
                             String destinationPortName, boolean carryingIllegalCargo,
                             BigDecimal baseFine, BigDecimal bribeCost, int detentionTicks) {
        this.id = UUID.randomUUID();
        this.playerId = playerId;
        this.sessionId = sessionId;
        this.travelId = travelId;
        this.playerShipId = playerShipId;
        this.destinationPortId = destinationPortId;
        this.shipName = shipName;
        this.originPortName = originPortName;
        this.destinationPortName = destinationPortName;
        this.carryingIllegalCargo = carryingIllegalCargo;
        this.baseFine = baseFine;
        this.bribeCost = bribeCost;
        this.detentionTicks = detentionTicks;
        this.status = CustomsInspectionStatus.PENDING_DECISION;
        this.finePaid = BigDecimal.ZERO;
        this.bribePaid = BigDecimal.ZERO;
        this.bribeAttempted = false;
    }

    public void completeAsCleared() {
        this.status = CustomsInspectionStatus.COMPLETED;
        this.outcome = CustomsInspectionOutcome.CLEARED;
        this.finePaid = BigDecimal.ZERO;
        this.bribePaid = BigDecimal.ZERO;
    }

    public void completeAsHidden() {
        this.status = CustomsInspectionStatus.COMPLETED;
        this.outcome = CustomsInspectionOutcome.HIDDEN;
        this.finePaid = BigDecimal.ZERO;
        this.bribePaid = BigDecimal.ZERO;
    }

    public void cooperate() {
        ensurePendingDecision();
        this.status = CustomsInspectionStatus.COMPLETED;
        this.outcome = CustomsInspectionOutcome.COOPERATED;
        this.finePaid = this.baseFine;
        this.bribePaid = BigDecimal.ZERO;
    }

    /**
     * Marks the inspection as bribed. The bribe cost is paid regardless of success.
     * On success: no fine. On failure: double fine on top of the bribe cost.
     */
    public void bribe(boolean success) {
        ensurePendingDecision();
        this.status = CustomsInspectionStatus.COMPLETED;
        this.bribeAttempted = true;
        this.bribePaid = this.bribeCost;
        if (success) {
            this.outcome = CustomsInspectionOutcome.BRIBE_SUCCESS;
            this.finePaid = BigDecimal.ZERO;
        } else {
            this.outcome = CustomsInspectionOutcome.BRIBE_FAILED;
            this.finePaid = this.baseFine.multiply(BigDecimal.valueOf(2));
        }
    }

    public boolean isDetained() {
        return outcome == CustomsInspectionOutcome.COOPERATED
                || outcome == CustomsInspectionOutcome.BRIBE_FAILED;
    }

    public boolean requiresPlayerDecision() {
        return status == CustomsInspectionStatus.PENDING_DECISION;
    }

    /**
     * Total amount the player has to pay out of pocket as a result of this inspection.
     */
    public BigDecimal getTotalOutOfPocket() {
        return this.finePaid.add(this.bribePaid);
    }

    private void ensurePendingDecision() {
        if (this.status != CustomsInspectionStatus.PENDING_DECISION) {
            throw new CustomsInspectionInvalidStateException(this.id, this.status);
        }
    }

    public UUID getId() { return id; }
    public UUID getPlayerId() { return playerId; }
    public UUID getSessionId() { return sessionId; }
    public UUID getTravelId() { return travelId; }
    public UUID getPlayerShipId() { return playerShipId; }
    public UUID getDestinationPortId() { return destinationPortId; }
    public String getShipName() { return shipName; }
    public String getOriginPortName() { return originPortName; }
    public String getDestinationPortName() { return destinationPortName; }
    public boolean isCarryingIllegalCargo() { return carryingIllegalCargo; }
    public BigDecimal getBaseFine() { return baseFine; }
    public BigDecimal getBribeCost() { return bribeCost; }
    public int getDetentionTicks() { return detentionTicks; }
    public CustomsInspectionStatus getStatus() { return status; }
    public CustomsInspectionOutcome getOutcome() { return outcome; }
    public BigDecimal getFinePaid() { return finePaid; }
    public BigDecimal getBribePaid() { return bribePaid; }
    public boolean isBribeAttempted() { return bribeAttempted; }
}