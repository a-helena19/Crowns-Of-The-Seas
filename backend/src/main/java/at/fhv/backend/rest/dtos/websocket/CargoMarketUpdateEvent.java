package at.fhv.backend.rest.dtos.websocket;

import at.fhv.backend.rest.dtos.cargo.response.SessionCargoDTO;

import java.util.List;

public class CargoMarketUpdateEvent {
    private boolean refreshNeeded;

    public CargoMarketUpdateEvent() {
        this.refreshNeeded = true;
    }

    public boolean isRefreshNeeded() {
        return refreshNeeded;
    }

    public void setRefreshNeeded(boolean refreshNeeded) {
        this.refreshNeeded = refreshNeeded;
    }
}
