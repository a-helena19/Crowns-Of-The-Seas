package at.fhv.backend.infrastructure.mapper;

import at.fhv.backend.domain.model.travel.Travel;
import at.fhv.backend.infrastructure.persistence.travel.TravelEntity;
import org.springframework.stereotype.Component;

@Component
public class TravelMapper implements  EntityMapper<Travel, TravelEntity> {
    @Override
    public TravelEntity toJpaEntity(Travel travel) {
        TravelEntity entity = new TravelEntity();
        entity.setTravelId(travel.getTravelId());
        entity.setPlayerShipId(travel.getPlayerShipId());
        entity.setPlayerId(travel.getPlayerId());
        entity.setSessionId(travel.getSessionId());
        entity.setOriginPortId(travel.getOriginPortId());
        entity.setDestinationPortId(travel.getDestinationPortId());
        entity.setDistance(travel.getDistance());
        entity.setSpeedSetting(travel.getSpeedSetting());
        entity.setRiskFactor(travel.getRiskFactor());
        entity.setBaseReward(travel.getBaseReward());
        entity.setTravelStatus(travel.getTravelStatus());
        entity.setStartedAt(travel.getStartedAt());
        entity.setArrivedAt(travel.getArrivedAt());
        entity.setFuelConsumed(travel.getFuelConsumed());
        entity.setStartTick(travel.getStartTick());
        entity.setArrivalTick(travel.getArrivalTick());
        entity.setDepartureDockingFine(travel.getDepartureDockingFine());
        entity.setDockingFine(travel.getDockingFine());
        entity.setPilotageServiceBooked(travel.isPilotageServiceBooked());
        entity.setPilotageStrikeRevoked(travel.isPilotageStrikeRevoked());
        entity.setPilotageRefund(travel.getPilotageRefund());
        entity.setArrivalMiniGamePending(travel.isArrivalMiniGamePending());
        entity.setEmptyVoyage(travel.isEmptyVoyage());
        entity.setRemainingCargoFactor(travel.getRemainingCargoFactor());
        return entity;
    }

    @Override
    public Travel toDomainModel(TravelEntity entity) {
        return Travel.reconstruct(
                entity.getTravelId(),
                entity.getPlayerShipId(),
                entity.getPlayerId(),
                entity.getSessionId(),
                entity.getOriginPortId(),
                entity.getDestinationPortId(),
                entity.getDistance(),
                entity.getSpeedSetting(),
                entity.getRiskFactor(),
                entity.getBaseReward(),
                entity.getTravelStatus(),
                entity.getStartedAt(),
                entity.getArrivedAt(),
                entity.getFuelConsumed(),
                entity.getStartTick(),
                entity.getArrivalTick(),
                entity.getDepartureDockingFine(),
                entity.getDockingFine(),
                entity.isPilotageServiceBooked(),
                entity.isPilotageStrikeRevoked(),
                entity.getPilotageRefund(),
                entity.isArrivalMiniGamePending(),
                entity.isEmptyVoyage(),
                entity.getRemainingCargoFactor()
        );
    }
}
