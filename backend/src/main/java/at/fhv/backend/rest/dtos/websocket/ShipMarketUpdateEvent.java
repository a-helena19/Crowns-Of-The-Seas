package at.fhv.backend.rest.dtos.websocket;

import at.fhv.backend.rest.dtos.ship.response.ShipDTO;

import java.util.List;

public class ShipMarketUpdateEvent {
    private List<ShipDTO> ships;

    public ShipMarketUpdateEvent() {}

    public ShipMarketUpdateEvent(List<ShipDTO> ships) {
        this.ships = ships;
    }

    public List<ShipDTO> getShips() {
        return ships;
    }

    public void setShips(List<ShipDTO> ships) {
        this.ships = ships;
    }
}
