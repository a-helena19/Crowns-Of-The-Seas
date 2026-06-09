package at.fhv.backend.application.services;

import at.fhv.backend.application.services.impl.travel.RegressServiceImpl;
import at.fhv.backend.domain.model.cargo.CargoStatus;
import at.fhv.backend.domain.model.cargo.CargoType;
import at.fhv.backend.domain.model.cargo.SessionCargo;
import at.fhv.backend.domain.model.customs.RegressFine;
import at.fhv.backend.domain.model.travel.Travel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

class RegressServiceImplTest {

    private RegressServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new RegressServiceImpl();
    }

    @Test
    void givenMinigameCargoLoss_whenEvaluateRegress_thenLostCargoIsOwnComponent() {
        Travel travel = buildTravel();
        travel.applyCargoLossPercent(50);

        RegressFine fine = service.evaluateAndStore(travel, travel.getArrivalTick(), 100.0,
                List.of(cargoWithReward("1000")));

        assertThat(fine.getCargoLossPercent()).isEqualTo(50.0);
        assertThat(fine.getCargoLossComponent()).isEqualByComparingTo("500");
        assertThat(fine.getDelayComponent()).isZero();
        assertThat(fine.getTotalFine()).isEqualByComparingTo("500");
    }

    @Test
    void givenMultipleMinigameCargoLosses_whenEvaluateRegress_thenLossesAreCombinedSequentially() {
        Travel travel = buildTravel();
        travel.applyCargoLossPercent(50);
        travel.applyCargoLossPercent(70);

        RegressFine fine = service.evaluateAndStore(travel, travel.getArrivalTick(), 100.0,
                List.of(cargoWithReward("1000")));

        assertThat(travel.getRemainingCargoFactor()).isCloseTo(0.15, within(0.000001));
        assertThat(fine.getCargoLossPercent()).isEqualTo(85.0);
        assertThat(fine.getCargoLossComponent()).isEqualByComparingTo("850");
        assertThat(fine.getTotalFine()).isEqualByComparingTo("850");
    }

    @Test
    void givenNoCargoLoss_whenEvaluateRegress_thenNoCargoLossComponentIsAdded() {
        Travel travel = buildTravel();

        RegressFine fine = service.evaluateAndStore(travel, travel.getArrivalTick(), 100.0,
                List.of(cargoWithReward("1000")));

        assertThat(fine.getCargoLossPercent()).isZero();
        assertThat(fine.getCargoLossComponent()).isZero();
        assertThat(fine.getTotalFine()).isZero();
    }

    @Test
    void givenCargoLossOnly_whenEvaluateRegress_thenNoSeparateDelayOrDamagePenaltyIsCreated() {
        Travel travel = buildTravel();
        travel.applyCargoLossPercent(50);

        RegressFine fine = service.evaluateAndStore(travel, travel.getArrivalTick(), 100.0,
                List.of(cargoWithReward("1000")));

        assertThat(fine.getDelayTicks()).isZero();
        assertThat(fine.getDelayComponent()).isZero();
        assertThat(fine.getDamageComponent()).isZero();
        assertThat(fine.getCargoLossComponent()).isEqualByComparingTo(fine.getTotalFine());
    }

    @Test
    void givenTravelPausedForMinigame_whenEvaluateRegress_thenPauseDoesNotCountAsDelay() {
        Travel travel = buildTravel();
        travel.shiftScheduleForPause(5);

        RegressFine fine = service.evaluateAndStore(travel, travel.getArrivalTick(), 100.0,
                List.of(cargoWithReward("1000")));

        assertThat(fine.getDelayTicks()).isZero();
        assertThat(fine.getDelayComponent()).isZero();
    }

    private Travel buildTravel() {
        return Travel.start(
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                10.0,
                1.0,
                0.1,
                BigDecimal.ZERO,
                0
        );
    }

    private SessionCargo cargoWithReward(String reward) {
        return SessionCargo.reconstruct(
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                UUID.randomUUID(),
                new BigDecimal(reward),
                false,
                10,
                CargoType.GENERAL_GOODS,
                0.1,
                CargoStatus.ASSIGNED,
                UUID.randomUUID(),
                UUID.randomUUID(),
                0,
                0,
                -1,
                -1
        );
    }
}
