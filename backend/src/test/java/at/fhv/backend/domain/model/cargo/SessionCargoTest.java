package at.fhv.backend.domain.model.cargo;

import at.fhv.backend.domain.model.cargo.exception.CargoNotAssignedException;
import at.fhv.backend.domain.model.cargo.exception.CargoNotAvailableException;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

class SessionCargoTest {
    private SessionCargo buildInactiveCargo(int spawnTick, int lifetimeTicks) {
        return SessionCargo.create(
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                BigDecimal.valueOf(1000),
                false,
                50,
                CargoType.GENERAL_GOODS,
                0.1,
                spawnTick,
                lifetimeTicks
        );
    }

    private SessionCargo buildAvailableCargo() {
        SessionCargo cargo = buildInactiveCargo(0, 100);
        cargo.activate();
        return cargo;
    }

    @Test
    void givenValidParams_whenCreate_thenStatusIsInactive() {
        SessionCargo cargo = buildInactiveCargo(0, 100);
        assertThat(cargo.getCargoStatus()).isEqualTo(CargoStatus.INACTIVE);
    }

    @Test
    void givenValidParams_whenCreate_thenAssignedPlayerIdIsNull() {
        SessionCargo cargo = buildInactiveCargo(0, 100);
        assertThat(cargo.getAssignedPlayerId()).isNull();
    }

    @Test
    void givenValidParams_whenCreate_thenAssignedPlayerShipIdIsNull() {
        SessionCargo cargo = buildInactiveCargo(0, 100);
        assertThat(cargo.getAssignedPlayerShipId()).isNull();
    }

    @Test
    void givenSpawnTick5AndLifetime20_whenCreate_thenExpiresAtTickIs25() {
        SessionCargo cargo = buildInactiveCargo(5, 20);
        assertThat(cargo.getExpiresAtTick()).isEqualTo(25);
    }

    @Test
    void givenValidParams_whenCreate_thenIdIsNotNull() {
        SessionCargo cargo = buildInactiveCargo(0, 100);
        assertThat(cargo.getId()).isNotNull();
    }

    @Test
    void givenInactiveCargo_whenActivate_thenStatusIsAvailable() {
        SessionCargo cargo = buildInactiveCargo(0, 100);
        cargo.activate();
        assertThat(cargo.getCargoStatus()).isEqualTo(CargoStatus.AVAILABLE);
    }

    @Test
    void givenInactiveCargo_whenActivate_thenCooldownUntilTickIsMinusOne() {
        SessionCargo cargo = buildInactiveCargo(0, 100);
        cargo.activate();
        assertThat(cargo.getCooldownUntilTick()).isEqualTo(-1);
    }

    @Test
    void givenAlreadyAvailableCargo_whenActivateAgain_thenStatusStaysAvailable() {
        SessionCargo cargo = buildInactiveCargo(0, 100);
        cargo.activate();
        cargo.activate(); // zweiter Aufruf – kein Effekt erwartet
        assertThat(cargo.getCargoStatus()).isEqualTo(CargoStatus.AVAILABLE);
    }

    @Test
    void givenAvailableCargo_whenAssign_thenStatusIsAssigned() {
        SessionCargo cargo = buildAvailableCargo();
        cargo.assign(UUID.randomUUID(), UUID.randomUUID(), 50);
        assertThat(cargo.getCargoStatus()).isEqualTo(CargoStatus.ASSIGNED);
    }

    @Test
    void givenAvailableCargo_whenAssign_thenPlayerIdIsSet() {
        UUID playerId = UUID.randomUUID();
        SessionCargo cargo = buildAvailableCargo();
        cargo.assign(playerId, UUID.randomUUID(), 50);
        assertThat(cargo.getAssignedPlayerId()).isEqualTo(playerId);
    }

    @Test
    void givenAvailableCargo_whenAssign_thenShipIdIsSet() {
        UUID shipId = UUID.randomUUID();
        SessionCargo cargo = buildAvailableCargo();
        cargo.assign(UUID.randomUUID(), shipId, 50);
        assertThat(cargo.getAssignedPlayerShipId()).isEqualTo(shipId);
    }

    @Test
    void givenAvailableCargo_whenAssign_thenExpiresAtTickIsUpdated() {
        SessionCargo cargo = buildAvailableCargo();
        cargo.assign(UUID.randomUUID(), UUID.randomUUID(), 75);
        assertThat(cargo.getExpiresAtTick()).isEqualTo(75);
    }

    @Test
    void givenInactiveCargo_whenAssign_thenThrowsCargoNotAvailableException() {
        SessionCargo cargo = buildInactiveCargo(0, 100);
        assertThatThrownBy(() -> cargo.assign(UUID.randomUUID(), UUID.randomUUID(), 50))
                .isInstanceOf(CargoNotAvailableException.class);
    }

    @Test
    void givenAlreadyAssignedCargo_whenAssignAgain_thenThrowsCargoNotAvailableException() {
        SessionCargo cargo = buildAvailableCargo();
        cargo.assign(UUID.randomUUID(), UUID.randomUUID(), 50);
        assertThatThrownBy(() -> cargo.assign(UUID.randomUUID(), UUID.randomUUID(), 60))
                .isInstanceOf(CargoNotAvailableException.class);
    }

    @Test
    void givenAssignedCargo_whenDeliver_thenStatusIsDelivered() {
        SessionCargo cargo = buildAvailableCargo();
        cargo.assign(UUID.randomUUID(), UUID.randomUUID(), 50);
        cargo.deliver();
        assertThat(cargo.getCargoStatus()).isEqualTo(CargoStatus.DELIVERED);
    }

    @Test
    void givenAvailableCargo_whenDeliver_thenThrowsCargoNotAssignedException() {
        SessionCargo cargo = buildAvailableCargo();
        assertThatThrownBy(cargo::deliver)
                .isInstanceOf(CargoNotAssignedException.class);
    }

    @Test
    void givenInactiveCargo_whenDeliver_thenThrowsCargoNotAssignedException() {
        SessionCargo cargo = buildInactiveCargo(0, 100);
        assertThatThrownBy(cargo::deliver)
                .isInstanceOf(CargoNotAssignedException.class);
    }

    @Test
    void givenAssignedCargo_whenExpire_thenStatusIsExpired() {
        SessionCargo cargo = buildAvailableCargo();
        cargo.assign(UUID.randomUUID(), UUID.randomUUID(), 50);
        cargo.expire(80);
        assertThat(cargo.getCargoStatus()).isEqualTo(CargoStatus.EXPIRED);
    }

    @Test
    void givenAssignedCargo_whenExpire_thenAssignedPlayerIsNull() {
        SessionCargo cargo = buildAvailableCargo();
        cargo.assign(UUID.randomUUID(), UUID.randomUUID(), 50);
        cargo.expire(80);
        assertThat(cargo.getAssignedPlayerId()).isNull();
    }

    @Test
    void givenAssignedCargo_whenExpire_thenAssignedShipIsNull() {
        SessionCargo cargo = buildAvailableCargo();
        cargo.assign(UUID.randomUUID(), UUID.randomUUID(), 50);
        cargo.expire(80);
        assertThat(cargo.getAssignedPlayerShipId()).isNull();
    }

    @Test
    void givenAssignedCargo_whenExpire_thenCooldownUntilTickIsSet() {
        SessionCargo cargo = buildAvailableCargo();
        cargo.assign(UUID.randomUUID(), UUID.randomUUID(), 50);
        cargo.expire(99);
        assertThat(cargo.getCooldownUntilTick()).isEqualTo(99);
    }

    @Test
    void givenAssignedCargo_whenExpire_thenExpiresAtTickIsMinusOne() {
        SessionCargo cargo = buildAvailableCargo();
        cargo.assign(UUID.randomUUID(), UUID.randomUUID(), 50);
        cargo.expire(80);
        assertThat(cargo.getExpiresAtTick()).isEqualTo(-1);
    }

    @Test
    void givenDeliveredCargo_whenStartCooldown_thenStatusIsInactive() {
        SessionCargo cargo = buildAvailableCargo();
        cargo.assign(UUID.randomUUID(), UUID.randomUUID(), 50);
        cargo.deliver();
        cargo.startCooldown(200);
        assertThat(cargo.getCargoStatus()).isEqualTo(CargoStatus.INACTIVE);
    }

    @Test
    void givenDeliveredCargo_whenStartCooldown_thenCooldownUntilTickIsSet() {
        SessionCargo cargo = buildAvailableCargo();
        cargo.assign(UUID.randomUUID(), UUID.randomUUID(), 50);
        cargo.deliver();
        cargo.startCooldown(200);
        assertThat(cargo.getCooldownUntilTick()).isEqualTo(200);
    }

    @Test
    void givenDeliveredCargo_whenStartCooldown_thenAssignedPlayerIsNull() {
        SessionCargo cargo = buildAvailableCargo();
        cargo.assign(UUID.randomUUID(), UUID.randomUUID(), 50);
        cargo.deliver();
        cargo.startCooldown(200);
        assertThat(cargo.getAssignedPlayerId()).isNull();
    }

    @Test
    void givenAvailableCargoAndCurrentTickAtSpawn_whenIsVisibleAt_thenTrue() {
        SessionCargo cargo = buildInactiveCargo(10, 100);
        cargo.activate();
        assertThat(cargo.isVisibleAt(10)).isTrue();
    }

    @Test
    void givenAvailableCargoAndTickBeforeSpawn_whenIsVisibleAt_thenFalse() {
        SessionCargo cargo = buildInactiveCargo(10, 100);
        cargo.activate();
        assertThat(cargo.isVisibleAt(9)).isFalse();
    }

    @Test
    void givenInactiveCargo_whenIsVisibleAt_thenFalse() {
        SessionCargo cargo = buildInactiveCargo(0, 100);
        assertThat(cargo.isVisibleAt(0)).isFalse();
    }

    @Test
    void givenAssignedCargo_whenIsVisibleAt_thenFalse() {
        SessionCargo cargo = buildAvailableCargo();
        cargo.assign(UUID.randomUUID(), UUID.randomUUID(), 50);
        assertThat(cargo.isVisibleAt(0)).isFalse();
    }

    @Test
    void givenExpiredCargoAndTickAtCooldown_whenShouldRespawnAt_thenTrue() {
        SessionCargo cargo = buildAvailableCargo();
        cargo.assign(UUID.randomUUID(), UUID.randomUUID(), 50);
        cargo.expire(20);
        assertThat(cargo.shouldRespawnAt(20)).isTrue();
    }

    @Test
    void givenExpiredCargoAndTickBeforeCooldown_whenShouldRespawnAt_thenFalse() {
        SessionCargo cargo = buildAvailableCargo();
        cargo.assign(UUID.randomUUID(), UUID.randomUUID(), 50);
        cargo.expire(20);
        assertThat(cargo.shouldRespawnAt(19)).isFalse();
    }

    @Test
    void givenInactiveCargo_whenCooldownNegativeOne_whenShouldRespawnAt_thenFalse() {
        // Frisch erzeugtes INACTIVE-Cargo hat cooldownUntilTick = -1
        SessionCargo cargo = buildInactiveCargo(0, 100);
        assertThat(cargo.shouldRespawnAt(0)).isFalse();
    }

    @Test
    void givenAvailableCargo_whenShouldRespawnAt_thenFalse() {
        SessionCargo cargo = buildAvailableCargo();
        assertThat(cargo.shouldRespawnAt(0)).isFalse();
    }

    @Test
    void givenAssignedCargoAndTickAfterExpiry_whenIsExpiredAt_thenTrue() {
        SessionCargo cargo = buildAvailableCargo();
        cargo.assign(UUID.randomUUID(), UUID.randomUUID(), 30);
        assertThat(cargo.isExpiredAt(31)).isTrue();
    }

    @Test
    void givenAssignedCargoAndTickAtExpiry_whenIsExpiredAt_thenFalse() {
        SessionCargo cargo = buildAvailableCargo();
        cargo.assign(UUID.randomUUID(), UUID.randomUUID(), 30);
        assertThat(cargo.isExpiredAt(30)).isFalse();
    }

    @Test
    void givenAssignedCargoAndTickBeforeExpiry_whenIsExpiredAt_thenFalse() {
        SessionCargo cargo = buildAvailableCargo();
        cargo.assign(UUID.randomUUID(), UUID.randomUUID(), 30);
        assertThat(cargo.isExpiredAt(29)).isFalse();
    }

    @Test
    void givenAvailableCargo_whenIsExpiredAt_thenFalse() {
        SessionCargo cargo = buildAvailableCargo();
        assertThat(cargo.isExpiredAt(999)).isFalse();
    }

    @Test
    void givenFullParams_whenReconstruct_thenAllFieldsAreRestored() {
        UUID id = UUID.randomUUID();
        UUID cargoId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        UUID originPortId = UUID.randomUUID();
        UUID destPortId = UUID.randomUUID();
        UUID playerId = UUID.randomUUID();
        UUID shipId = UUID.randomUUID();

        SessionCargo cargo = SessionCargo.reconstruct(
                id, cargoId, sessionId, originPortId, destPortId,
                BigDecimal.valueOf(500), true, 100,
                CargoType.HAZARDOUS, 0.8, CargoStatus.ASSIGNED,
                playerId, shipId, 10, -1, 50
        );

        assertThat(cargo.getId()).isEqualTo(id);
        assertThat(cargo.getCargoId()).isEqualTo(cargoId);
        assertThat(cargo.getSessionId()).isEqualTo(sessionId);
        assertThat(cargo.getCargoStatus()).isEqualTo(CargoStatus.ASSIGNED);
        assertThat(cargo.getAssignedPlayerId()).isEqualTo(playerId);
        assertThat(cargo.getAssignedPlayerShipId()).isEqualTo(shipId);
        assertThat(cargo.isContainsIllegal()).isTrue();
        assertThat(cargo.getExpiresAtTick()).isEqualTo(50);
    }
}