package at.fhv.backend.domain.model.ship;

import at.fhv.backend.domain.model.exception.InvalidShipStatusTransition;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

class PlayerShipTest {

    private UUID shipId;
    private UUID playerId;
    private UUID sessionId;
    private UUID startPortId;
    private PlayerShip playerShip;

    @BeforeEach
    void setUp() {
        shipId      = UUID.randomUUID();
        playerId    = UUID.randomUUID();
        sessionId   = UUID.randomUUID();
        startPortId = UUID.randomUUID();
        playerShip  = PlayerShip.createFromPurchase(shipId, playerId, sessionId, startPortId, "Die Schwarze Perle");
    }

    // Konstruktor / Initialzustand

    @Test
    void givenNewPurchase_thenIdIsAssigned() {
        assertThat(playerShip.getId()).isNotNull();
    }

    @Test
    void givenTwoPurchases_thenIdsAreUnique() {
        PlayerShip other = PlayerShip.createFromPurchase(shipId, playerId, sessionId, startPortId, "Andere");
        assertThat(playerShip.getId()).isNotEqualTo(other.getId());
    }

    @Test
    void givenNewPurchase_thenStatusIsInRegistration() {
        assertThat(playerShip.getStatus()).isEqualTo(ShipStatus.IN_REGISTRATION);
    }

    @Test
    void givenNewPurchase_thenConditionIsHundred() {
        assertThat(playerShip.getCondition()).isEqualTo(100.0);
    }

    @Test
    void givenNewPurchase_thenFuelIsHundred() {
        assertThat(playerShip.getFuel()).isEqualTo(100.0);
    }

    @Test
    void givenNewPurchase_thenFieldsAreSetCorrectly() {
        assertThat(playerShip.getShipId()).isEqualTo(shipId);
        assertThat(playerShip.getPlayerId()).isEqualTo(playerId);
        assertThat(playerShip.getSessionId()).isEqualTo(sessionId);
        assertThat(playerShip.getCurrentPortId()).isEqualTo(startPortId);
        assertThat(playerShip.getTargetPortId()).isNull();
        assertThat(playerShip.getCustomName()).isEqualTo("Die Schwarze Perle");
    }

    // completeRegistration

    @Test
    void givenInRegistration_whenCompleteRegistration_thenStatusIsAtPort() {
        playerShip.completeRegistration();
        assertThat(playerShip.getStatus()).isEqualTo(ShipStatus.AT_PORT);
    }

    @Test
    void givenAtPort_whenCompleteRegistration_thenThrowsInvalidShipStatusTransition() {
        playerShip.completeRegistration();
        assertThatThrownBy(() -> playerShip.completeRegistration())
                .isInstanceOf(InvalidShipStatusTransition.class);
    }

    @Test
    void givenEnRoute_whenCompleteRegistration_thenThrowsInvalidShipStatusTransition() {
        playerShip.completeRegistration();
        playerShip.departForVoyage(UUID.randomUUID());
        assertThatThrownBy(() -> playerShip.completeRegistration())
                .isInstanceOf(InvalidShipStatusTransition.class);
    }

    // departForVoyage

    @Test
    void givenAtPort_whenDepartForVoyage_thenStatusIsEnRoute() {
        playerShip.completeRegistration();
        playerShip.departForVoyage(UUID.randomUUID());
        assertThat(playerShip.getStatus()).isEqualTo(ShipStatus.EN_ROUTE);
    }

    @Test
    void givenAtPort_whenDepartForVoyage_thenTargetPortIsSet() {
        playerShip.completeRegistration();
        UUID destination = UUID.randomUUID();
        playerShip.departForVoyage(destination);
        assertThat(playerShip.getTargetPortId()).isEqualTo(destination);
    }

    @Test
    void givenAtPort_whenDepartForVoyage_thenCurrentPortIsNull() {
        playerShip.completeRegistration();
        playerShip.departForVoyage(UUID.randomUUID());
        assertThat(playerShip.getCurrentPortId()).isNull();
    }

    @Test
    void givenInRegistration_whenDepartForVoyage_thenThrowsInvalidShipStatusTransition() {
        assertThatThrownBy(() -> playerShip.departForVoyage(UUID.randomUUID()))
                .isInstanceOf(InvalidShipStatusTransition.class);
    }

    // arriveAtPort

    @Test
    void givenEnRoute_whenArriveAtPort_thenStatusIsAtPort() {
        playerShip.completeRegistration();
        playerShip.departForVoyage(UUID.randomUUID());
        playerShip.arriveAtPort(UUID.randomUUID());
        assertThat(playerShip.getStatus()).isEqualTo(ShipStatus.AT_PORT);
    }

    @Test
    void givenEnRoute_whenArriveAtPort_thenCurrentPortIsSet() {
        playerShip.completeRegistration();
        playerShip.departForVoyage(UUID.randomUUID());
        UUID arrivalPort = UUID.randomUUID();
        playerShip.arriveAtPort(arrivalPort);
        assertThat(playerShip.getCurrentPortId()).isEqualTo(arrivalPort);
    }

    @Test
    void givenEnRoute_whenArriveAtPort_thenTargetPortIsNull() {
        playerShip.completeRegistration();
        playerShip.departForVoyage(UUID.randomUUID());
        playerShip.arriveAtPort(UUID.randomUUID());
        assertThat(playerShip.getTargetPortId()).isNull();
    }

    @Test
    void givenAtPort_whenArriveAtPort_thenThrowsInvalidShipStatusTransition() {
        playerShip.completeRegistration();
        assertThatThrownBy(() -> playerShip.arriveAtPort(UUID.randomUUID()))
                .isInstanceOf(InvalidShipStatusTransition.class);
    }

    // consumeFuel

    @Test
    void givenFullFuel_whenConsumeFuel_thenFuelIsReduced() {
        playerShip.consumeFuel(20.0);
        assertThat(playerShip.getFuel()).isEqualTo(80.0);
    }

    @Test
    void givenFuelAboveZero_whenConsumingMoreThanAvailable_thenFuelIsZero() {
        playerShip.consumeFuel(150.0);
        assertThat(playerShip.getFuel()).isEqualTo(0.0);
    }

    @Test
    void givenZeroFuel_whenConsumeFuel_thenFuelRemainsZero() {
        playerShip.consumeFuel(100.0);
        playerShip.consumeFuel(10.0);
        assertThat(playerShip.getFuel()).isEqualTo(0.0);
    }

    // applyWear

    @Test
    void givenFullCondition_whenApplyWear_thenConditionIsReduced() {
        playerShip.applyWear(10.0);
        assertThat(playerShip.getCondition()).isEqualTo(90.0);
    }

    @Test
    void givenConditionAboveZero_whenApplyingMoreThanAvailable_thenConditionIsZero() {
        playerShip.applyWear(200.0);
        assertThat(playerShip.getCondition()).isEqualTo(0.0);
    }

    @Test
    void givenZeroCondition_whenApplyWear_thenConditionRemainsZero() {
        playerShip.applyWear(100.0);
        playerShip.applyWear(50.0);
        assertThat(playerShip.getCondition()).isEqualTo(0.0);
    }

    // isOwnedBy

    @Test
    void givenCorrectPlayerId_whenIsOwnedBy_thenTrue() {
        assertThat(playerShip.isOwnedBy(playerId)).isTrue();
    }

    @Test
    void givenDifferentPlayerId_whenIsOwnedBy_thenFalse() {
        assertThat(playerShip.isOwnedBy(UUID.randomUUID())).isFalse();
    }

    // reconstruct

    @Test
    void givenReconstructedPlayerShip_thenFieldsMatch() {
        UUID id         = UUID.randomUUID();
        UUID portId     = UUID.randomUUID();
        UUID targetPort = UUID.randomUUID();

        PlayerShip reconstructed = PlayerShip.reconstruct(id, shipId, playerId, sessionId,
                ShipStatus.EN_ROUTE, 75.0, 60.0, portId, targetPort, "Meine Fregatte");

        assertThat(reconstructed.getId()).isEqualTo(id);
        assertThat(reconstructed.getShipId()).isEqualTo(shipId);
        assertThat(reconstructed.getPlayerId()).isEqualTo(playerId);
        assertThat(reconstructed.getSessionId()).isEqualTo(sessionId);
        assertThat(reconstructed.getStatus()).isEqualTo(ShipStatus.EN_ROUTE);
        assertThat(reconstructed.getCondition()).isEqualTo(75.0);
        assertThat(reconstructed.getFuel()).isEqualTo(60.0);
        assertThat(reconstructed.getCurrentPortId()).isEqualTo(portId);
        assertThat(reconstructed.getTargetPortId()).isEqualTo(targetPort);
        assertThat(reconstructed.getCustomName()).isEqualTo("Meine Fregatte");
    }
}