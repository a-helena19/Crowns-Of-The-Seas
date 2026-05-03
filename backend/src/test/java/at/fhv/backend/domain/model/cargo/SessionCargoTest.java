package at.fhv.backend.domain.model.cargo;

import at.fhv.backend.domain.model.cargo.exception.CargoNotAssignedException;
import at.fhv.backend.domain.model.cargo.exception.CargoNotAvailableException;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

class SessionCargoTest {
    private SessionCargo buildCargo(int spawnTick, int lifetimeTicks) {
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
                lifetimeTicks,
                false
        );
    }

    private SessionCargo buildPermanentCargo() {
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
                0,
                100,
                true
        );
    }

    @Test
    void givenValidParams_whenCreate_thenStatusIsAvailable() {
        SessionCargo cargo = buildCargo(0, 100);
        assertThat(cargo.getCargoStatus()).isEqualTo(CargoStatus.AVAILABLE);
    }

    @Test
    void givenValidParams_whenCreate_thenAssignedPlayerIdIsNull() {
        SessionCargo cargo = buildCargo(0, 100);
        assertThat(cargo.getAssignedPlayerId()).isNull();
    }

    @Test
    void givenValidParams_whenCreate_thenAssignedPlayerShipIdIsNull() {
        SessionCargo cargo = buildCargo(0, 100);
        assertThat(cargo.getAssignedPlayerShipId()).isNull();
    }

    @Test
    void givenSpawnTick5AndLifetime20_whenCreate_thenExpiresAtTickIs25() {
        SessionCargo cargo = buildCargo(5, 20);
        assertThat(cargo.getExpiresAtTick()).isEqualTo(25);
    }

    @Test
    void givenValidParams_whenCreate_thenIdIsNotNull() {
        SessionCargo cargo = buildCargo(0, 100);
        assertThat(cargo.getId()).isNotNull();
    }

    @Test
    void givenPermanentCargo_whenCreate_thenExpiresAtTickIsMinusOne() {
        SessionCargo cargo = buildPermanentCargo();
        assertThat(cargo.getExpiresAtTick()).isEqualTo(-1);
        assertThat(cargo.isPermanent()).isTrue();
    }

    @Test
    void givenPermanentCargo_whenIsExpiredAt_thenAlwaysFalse() {
        SessionCargo cargo = buildPermanentCargo();
        cargo.assign(UUID.randomUUID(), UUID.randomUUID(), 50);
        assertThat(cargo.isExpiredAt(999)).isFalse();
    }

    @Test
    void givenAvailableCargo_whenAssign_thenStatusIsAssigned() {
        SessionCargo cargo = buildCargo(0, 100);
        cargo.assign(UUID.randomUUID(), UUID.randomUUID(), 50);
        assertThat(cargo.getCargoStatus()).isEqualTo(CargoStatus.ASSIGNED);
    }

    @Test
    void givenAvailableCargo_whenAssign_thenPlayerIdIsSet() {
        UUID playerId = UUID.randomUUID();
        SessionCargo cargo = buildCargo(0, 100);
        cargo.assign(playerId, UUID.randomUUID(), 50);
        assertThat(cargo.getAssignedPlayerId()).isEqualTo(playerId);
    }

    @Test
    void givenAvailableCargo_whenAssign_thenShipIdIsSet() {
        UUID shipId = UUID.randomUUID();
        SessionCargo cargo = buildCargo(0, 100);
        cargo.assign(UUID.randomUUID(), shipId, 50);
        assertThat(cargo.getAssignedPlayerShipId()).isEqualTo(shipId);
    }

    @Test
    void givenAlreadyAssignedCargo_whenAssignAgain_thenThrowsCargoNotAvailableException() {
        SessionCargo cargo = buildCargo(0, 100);
        cargo.assign(UUID.randomUUID(), UUID.randomUUID(), 50);
        assertThatThrownBy(() -> cargo.assign(UUID.randomUUID(), UUID.randomUUID(), 60))
                .isInstanceOf(CargoNotAvailableException.class);
    }

    @Test
    void givenAssignedCargo_whenDeliver_thenStatusIsDelivered() {
        SessionCargo cargo = buildCargo(0, 100);
        cargo.assign(UUID.randomUUID(), UUID.randomUUID(), 50);
        cargo.deliver();
        assertThat(cargo.getCargoStatus()).isEqualTo(CargoStatus.DELIVERED);
    }

    @Test
    void givenAvailableCargo_whenDeliver_thenThrowsCargoNotAssignedException() {
        SessionCargo cargo = buildCargo(0, 100);
        assertThatThrownBy(cargo::deliver)
                .isInstanceOf(CargoNotAssignedException.class);
    }

    @Test
    void givenAssignedCargo_whenExpire_thenStatusIsExpired() {
        SessionCargo cargo = buildCargo(0, 100);
        cargo.assign(UUID.randomUUID(), UUID.randomUUID(), 50);
        cargo.expire();
        assertThat(cargo.getCargoStatus()).isEqualTo(CargoStatus.EXPIRED);
    }

    @Test
    void givenAssignedCargo_whenExpire_thenAssignedPlayerIsNull() {
        SessionCargo cargo = buildCargo(0, 100);
        cargo.assign(UUID.randomUUID(), UUID.randomUUID(), 50);
        cargo.expire();
        assertThat(cargo.getAssignedPlayerId()).isNull();
    }

    @Test
    void givenAssignedCargo_whenExpire_thenAssignedShipIsNull() {
        SessionCargo cargo = buildCargo(0, 100);
        cargo.assign(UUID.randomUUID(), UUID.randomUUID(), 50);
        cargo.expire();
        assertThat(cargo.getAssignedPlayerShipId()).isNull();
    }

    @Test
    void givenAvailableCargoAndCurrentTickAtSpawn_whenIsVisibleAt_thenTrue() {
        SessionCargo cargo = buildCargo(10, 100);
        assertThat(cargo.isVisibleAt(10)).isTrue();
    }

    @Test
    void givenAvailableCargoAndTickBeforeSpawn_whenIsVisibleAt_thenFalse() {
        SessionCargo cargo = buildCargo(10, 100);
        assertThat(cargo.isVisibleAt(9)).isFalse();
    }

    @Test
    void givenAssignedCargo_whenIsVisibleAt_thenFalse() {
        SessionCargo cargo = buildCargo(0, 100);
        cargo.assign(UUID.randomUUID(), UUID.randomUUID(), 50);
        assertThat(cargo.isVisibleAt(0)).isFalse();
    }

    @Test
    void givenAssignedCargoAndTickAfterExpiry_whenIsExpiredAt_thenTrue() {
        SessionCargo cargo = buildCargo(0, 100);
        cargo.assign(UUID.randomUUID(), UUID.randomUUID(), 30);
        assertThat(cargo.isExpiredAt(31)).isTrue();
    }

    @Test
    void givenAssignedCargoAndTickAtExpiry_whenIsExpiredAt_thenFalse() {
        SessionCargo cargo = buildCargo(0, 100);
        cargo.assign(UUID.randomUUID(), UUID.randomUUID(), 30);
        assertThat(cargo.isExpiredAt(30)).isFalse();
    }

    @Test
    void givenAssignedCargoAndTickBeforeExpiry_whenIsExpiredAt_thenFalse() {
        SessionCargo cargo = buildCargo(0, 100);
        cargo.assign(UUID.randomUUID(), UUID.randomUUID(), 30);
        assertThat(cargo.isExpiredAt(29)).isFalse();
    }

    @Test
    void givenAvailableCargo_whenIsExpiredAt_afterExpiresAtTick_thenTrue() {
        SessionCargo cargo = buildCargo(0, 10);
        // expiresAtTick = 0 + 10 = 10, AVAILABLE status
        assertThat(cargo.isExpiredAt(11)).isTrue();
    }

    @Test
    void givenAvailableCargo_whenIsExpiredAt_beforeExpiresAtTick_thenFalse() {
        SessionCargo cargo = buildCargo(0, 10);
        assertThat(cargo.isExpiredAt(9)).isFalse();
    }

    @Test
    void givenDeliveredCargo_whenIsExpiredAt_thenFalse() {
        SessionCargo cargo = buildCargo(0, 100);
        cargo.assign(UUID.randomUUID(), UUID.randomUUID(), 50);
        cargo.deliver();
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
                playerId, shipId, 10, 0, 50, -1
        );

        assertThat(cargo.getId()).isEqualTo(id);
        assertThat(cargo.getCargoId()).isEqualTo(cargoId);
        assertThat(cargo.getSessionId()).isEqualTo(sessionId);
        assertThat(cargo.getCargoStatus()).isEqualTo(CargoStatus.ASSIGNED);
        assertThat(cargo.getAssignedPlayerId()).isEqualTo(playerId);
        assertThat(cargo.getAssignedPlayerShipId()).isEqualTo(shipId);
        assertThat(cargo.isContainsIllegal()).isTrue();
        assertThat(cargo.getExpiresAtTick()).isEqualTo(50);
        assertThat(cargo.isPermanent()).isFalse();
    }

    @Test
    void givenPermanentReconstruct_whenIsPermanent_thenTrue() {
        SessionCargo cargo = SessionCargo.reconstruct(
                UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(),
                UUID.randomUUID(), UUID.randomUUID(),
                BigDecimal.valueOf(500), false, 50,
                CargoType.GENERAL_GOODS, 0.1, CargoStatus.AVAILABLE,
                null, null, 0, 1, -1, -1
        );
        assertThat(cargo.isPermanent()).isTrue();
        assertThat(cargo.getExpiresAtTick()).isEqualTo(-1);
    }
}
