package at.fhv.backend.domain.model.travel;

import at.fhv.backend.domain.model.exception.InvalidTravelDataException;
import at.fhv.backend.domain.model.exception.InvalidTravelStateException;
import at.fhv.backend.domain.model.exception.SamePortException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

class TravelTest {
    private UUID playerShipId;
    private UUID playerId;
    private UUID sessionId;
    private UUID originPortId;
    private UUID destinationPortId;
    private Travel travel;

    @BeforeEach
    void setUp() {
        playerShipId      = UUID.randomUUID();
        playerId          = UUID.randomUUID();
        sessionId         = UUID.randomUUID();
        originPortId      = UUID.randomUUID();
        destinationPortId = UUID.randomUUID();
        travel = Travel.start(playerShipId, playerId, sessionId, originPortId, destinationPortId,
                500.0, 1.0, 0.1, new BigDecimal("1000.00"), 0);
    }

    @Test
    void givenValidData_whenStart_thenTravelIdIsAssigned() {
        assertThat(travel.getTravelId()).isNotNull();
    }

    @Test
    void givenTwoTravels_thenIdsAreUnique() {
        Travel other = Travel.start(playerShipId, playerId, sessionId, originPortId, destinationPortId,
                500.0, 1.0, 0.1, new BigDecimal("1000.00"), 0);
        assertThat(travel.getTravelId()).isNotEqualTo(other.getTravelId());
    }

    @Test
    void givenValidData_whenStart_thenStatusIsInProgress() {
        assertThat(travel.getTravelStatus()).isEqualTo(TravelStatus.IN_PROGRESS);
    }

    @Test
    void givenValidData_whenStart_thenStartedAtIsSet() {
        assertThat(travel.getStartedAt()).isNotNull();
    }

    @Test
    void givenValidData_whenStart_thenArrivedAtIsNull() {
        assertThat(travel.getArrivedAt()).isNull();
    }

    @Test
    void givenValidData_whenStart_thenFuelConsumedIsZero() {
        assertThat(travel.getFuelConsumed()).isEqualTo(0.0);
    }

    @Test
    void givenValidData_whenStart_thenFieldsAreSetCorrectly() {
        assertThat(travel.getPlayerShipId()).isEqualTo(playerShipId);
        assertThat(travel.getPlayerId()).isEqualTo(playerId);
        assertThat(travel.getOriginPortId()).isEqualTo(originPortId);
        assertThat(travel.getDestinationPortId()).isEqualTo(destinationPortId);
        assertThat(travel.getDistance()).isEqualTo(500.0);
        assertThat(travel.getSpeedSetting()).isEqualTo(1.0);
        assertThat(travel.getRiskFactor()).isEqualTo(0.1);
        assertThat(travel.getBaseReward()).isEqualByComparingTo(new BigDecimal("1000.00"));
    }

    @Test
    void givenSameOriginAndDestination_whenStart_thenThrowsSamePortException() {
        assertThatThrownBy(() -> Travel.start(playerShipId, playerId, sessionId,
                originPortId, originPortId, 500.0, 1.0, 0.1, new BigDecimal("1000.00"), 0))
                .isInstanceOf(SamePortException.class);
    }

    @Test
    void givenZeroDistance_whenStart_thenThrowsInvalidTravelDataException() {
        assertThatThrownBy(() -> Travel.start(playerShipId, playerId, sessionId,
                originPortId, destinationPortId, 0.0, 1.0, 0.1, new BigDecimal("1000.00"), 0))
                .isInstanceOf(InvalidTravelDataException.class);
    }

    @Test
    void givenNegativeDistance_whenStart_thenThrowsInvalidTravelDataException() {
        assertThatThrownBy(() -> Travel.start(playerShipId, playerId, sessionId,
                originPortId, destinationPortId, -100.0, 1.0, 0.1, new BigDecimal("1000.00"), 0))
                .isInstanceOf(InvalidTravelDataException.class);
    }

    @Test
    void givenInProgress_whenMarkAsArrived_thenStatusIsArrived() {
        travel.markAsArrived(80.0, TravelStatus.ARRIVED);
        assertThat(travel.getTravelStatus()).isEqualTo(TravelStatus.ARRIVED);
    }

    @Test
    void givenInProgress_whenMarkAsArrived_thenArrivedAtIsSet() {
        travel.markAsArrived(80.0, TravelStatus.ARRIVED);
        assertThat(travel.getArrivedAt()).isNotNull();
    }

    @Test
    void givenInProgress_whenMarkAsArrived_thenFuelConsumedIsRecorded() {
        travel.markAsArrived(80.0, TravelStatus.ARRIVED);
        assertThat(travel.getFuelConsumed()).isEqualTo(80.0);
    }

    @Test
    void givenAlreadyArrived_whenMarkAsArrived_thenThrowsInvalidTravelStateException() {
        travel.markAsArrived(80.0, TravelStatus.ARRIVED);
        assertThatThrownBy(() -> travel.markAsArrived(10.0, TravelStatus.ARRIVED))
                .isInstanceOf(InvalidTravelStateException.class);
    }

    @Test
    void givenCancelled_whenMarkAsArrived_thenThrowsInvalidTravelStateException() {
        travel.cancel();
        assertThatThrownBy(() -> travel.markAsArrived(10.0, TravelStatus.ARRIVED))
                .isInstanceOf(InvalidTravelStateException.class);
    }

    @Test
    void givenInProgress_whenCancel_thenStatusIsCancelled() {
        travel.cancel();
        assertThat(travel.getTravelStatus()).isEqualTo(TravelStatus.CANCELLED);
    }

    @Test
    void givenAlreadyCancelled_whenCancel_thenThrowsInvalidTravelStateException() {
        travel.cancel();
        assertThatThrownBy(() -> travel.cancel()).isInstanceOf(InvalidTravelStateException.class);
    }

    @Test
    void givenArrived_whenCancel_thenThrowsInvalidTravelStateException() {
        travel.markAsArrived(80.0, TravelStatus.ARRIVED);
        assertThatThrownBy(() -> travel.cancel()).isInstanceOf(InvalidTravelStateException.class);
    }

    @Test
    void givenReconstructedTravel_thenFieldsMatch() {
        UUID travelId   = UUID.randomUUID();
        Instant started = Instant.now().minusSeconds(3600);
        Instant arrived = Instant.now();

        Travel reconstructed = Travel.reconstruct(travelId, playerShipId, playerId, sessionId,
                originPortId, destinationPortId, 300.0, 0.8, 0.2,
                new BigDecimal("500.00"), TravelStatus.ARRIVED, started, arrived, 45.0, 0, 10);

        assertThat(reconstructed.getTravelId()).isEqualTo(travelId);
        assertThat(reconstructed.getPlayerShipId()).isEqualTo(playerShipId);
        assertThat(reconstructed.getPlayerId()).isEqualTo(playerId);
        assertThat(reconstructed.getOriginPortId()).isEqualTo(originPortId);
        assertThat(reconstructed.getDestinationPortId()).isEqualTo(destinationPortId);
        assertThat(reconstructed.getDistance()).isEqualTo(300.0);
        assertThat(reconstructed.getSpeedSetting()).isEqualTo(0.8);
        assertThat(reconstructed.getRiskFactor()).isEqualTo(0.2);
        assertThat(reconstructed.getBaseReward()).isEqualByComparingTo(new BigDecimal("500.00"));
        assertThat(reconstructed.getTravelStatus()).isEqualTo(TravelStatus.ARRIVED);
        assertThat(reconstructed.getStartedAt()).isEqualTo(started);
        assertThat(reconstructed.getArrivedAt()).isEqualTo(arrived);
        assertThat(reconstructed.getFuelConsumed()).isEqualTo(45.0);
    }
}