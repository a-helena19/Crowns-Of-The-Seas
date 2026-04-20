package at.fhv.backend.rest.dtos.websocket;

import at.fhv.backend.rest.dtos.cargo.response.SessionCargoDTO;

import java.util.List;

public class CargoMarketUpdateEvent {
    private List<SessionCargoDTO> availableCargos;

    public CargoMarketUpdateEvent() {}

    public CargoMarketUpdateEvent(List<SessionCargoDTO> availableCargos) {
        this.availableCargos = availableCargos;
    }

    public List<SessionCargoDTO> getAvailableCargos() {
        return availableCargos;
    }

    public void setAvailableCargos(List<SessionCargoDTO> availableCargos) {
        this.availableCargos = availableCargos;
    }
}
