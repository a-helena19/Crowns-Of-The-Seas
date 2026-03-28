package at.fhv.backend.application.dtos.mapper;

import at.fhv.backend.application.dtos.response.TravelDTO;
import at.fhv.backend.domain.model.travel.Travel;
import org.springframework.stereotype.Component;

@Component
public class TravelResponseMapper implements DtoMapper<Travel, TravelDTO> {
    @Override
    public TravelDTO toResponse(Travel travel) {
        TravelDTO response = new TravelDTO();
        response.setTravelId(travel.getTravelId());
        response.setPlayerShipId(travel.getPlayerShipId());
        response.setPlayerId(travel.getPlayerId());
        response.setOriginPortId(travel.getOriginPortId());
        response.setDestinationPortId(travel.getDestinationPortId());
        response.setDistance(travel.getDistance());
        response.setSpeedSetting(travel.getSpeedSetting());
        response.setRiskFactor(travel.getRiskFactor());
        response.setBaseReward(travel.getBaseReward());
        response.setTravelStatus(travel.getTravelStatus());
        response.setStartedAt(travel.getStartedAt());
        response.setArrivedAt(travel.getArrivedAt());
        response.setFuelConsumed(travel.getFuelConsumed());
        return response;
    }
}
