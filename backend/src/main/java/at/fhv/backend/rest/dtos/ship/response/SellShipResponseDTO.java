package at.fhv.backend.rest.dtos.ship.response;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

public class SellShipResponseDTO {
    private UUID listingId;
    private UUID playerShipId;
    private BigDecimal sellPrice;
    private BigDecimal newBalance;

    public SellShipResponseDTO() {
    }

    public SellShipResponseDTO(UUID listingId, UUID playerShipId, BigDecimal sellPrice, BigDecimal newBalance) {
        this.listingId = listingId;
        this.playerShipId = playerShipId;
        this.sellPrice = roundTalers(sellPrice);
        this.newBalance = roundTalers(newBalance);
    }

    public UUID getListingId() {
        return listingId;
    }

    public void setListingId(UUID listingId) {
        this.listingId = listingId;
    }

    public UUID getPlayerShipId() {
        return playerShipId;
    }

    public void setPlayerShipId(UUID playerShipId) {
        this.playerShipId = playerShipId;
    }

    public BigDecimal getSellPrice() {
        return sellPrice;
    }

    public void setSellPrice(BigDecimal sellPrice) {
        this.sellPrice = roundTalers(sellPrice);
    }

    public BigDecimal getNewBalance() {
        return newBalance;
    }

    public void setNewBalance(BigDecimal newBalance) {
        this.newBalance = roundTalers(newBalance);
    }

    private static BigDecimal roundTalers(BigDecimal value) {
        return value == null ? null : value.setScale(0, RoundingMode.HALF_UP);
    }
}
