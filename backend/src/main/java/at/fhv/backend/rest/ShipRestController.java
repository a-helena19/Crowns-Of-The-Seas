package at.fhv.backend.rest;

import at.fhv.backend.rest.dtos.ship.request.BuyShipDTO;
import at.fhv.backend.rest.dtos.ship.response.PlayerShipDTO;
import at.fhv.backend.rest.dtos.ship.response.RefuelResponseDTO;
import at.fhv.backend.rest.dtos.ship.response.RepairResponseDTO;
import at.fhv.backend.rest.dtos.ship.response.SellShipQuoteDTO;
import at.fhv.backend.rest.dtos.ship.response.SellShipResponseDTO;
import at.fhv.backend.rest.dtos.ship.response.ShipDTO;
import at.fhv.backend.rest.dtos.ship.response.UsedShipListingDTO;
import at.fhv.backend.application.services.ship.PurchaseShipService;
import at.fhv.backend.application.services.ship.RefuelShipService;
import at.fhv.backend.application.services.ship.RepairShipService;
import at.fhv.backend.application.services.ship.ShipQueryService;
import at.fhv.backend.application.services.ship.UsedShipMarketService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ships")
public class ShipRestController {
    private final ShipQueryService shipQueryService;
    private final PurchaseShipService purchaseShipService;
    private final RefuelShipService refuelShipService;
    private final RepairShipService repairShipService;
    private final UsedShipMarketService usedShipMarketService;

    public ShipRestController(ShipQueryService shipQueryService,
                              PurchaseShipService purchaseShipService,
                              RefuelShipService refuelShipService,
                              RepairShipService repairShipService,
                              UsedShipMarketService usedShipMarketService) {
        this.shipQueryService = shipQueryService;
        this.purchaseShipService = purchaseShipService;
        this.refuelShipService = refuelShipService;
        this.repairShipService = repairShipService;
        this.usedShipMarketService = usedShipMarketService;
    }

    @GetMapping("/player/{playerId}")
    public ResponseEntity<List<PlayerShipDTO>> getPlayerShips(
            @PathVariable UUID playerId,
            @RequestParam UUID sessionId) {
        return ResponseEntity.ok(shipQueryService.getPlayerShips(playerId, sessionId));
    }

    @GetMapping("/{playerShipId}/player/{playerId}")
    public ResponseEntity<PlayerShipDTO> getPlayerShip(
            @PathVariable UUID playerShipId,
            @PathVariable UUID playerId,
            @RequestParam UUID sessionId) {
        return ResponseEntity.ok(shipQueryService.getPlayerShip(playerShipId, playerId, sessionId));
    }

    @GetMapping
    public ResponseEntity<List<ShipDTO>> getShipsByClass(
            @RequestParam(required = false) String shipClass,
            @RequestParam(required = false) UUID sessionId) {
        return ResponseEntity.ok(shipQueryService.getMarketShips(shipClass, sessionId));
    }

    @GetMapping("/player/{playerId}/balance")
    public ResponseEntity<BigDecimal> getPlayerBalance(
            @PathVariable UUID playerId,
            @RequestParam UUID sessionId) {
        return ResponseEntity.ok(purchaseShipService.getBalanceByPlayerId(playerId, sessionId));
    }

    @PostMapping("/buy/{playerId}")
    public ResponseEntity<PlayerShipDTO> buyShip(
            @PathVariable UUID playerId,
            @RequestParam UUID sessionId,
            @RequestBody @Valid BuyShipDTO request) {
        return ResponseEntity.ok(purchaseShipService.buyShip(playerId, sessionId, request));
    }

    @GetMapping("/{playerShipId}/sell-quote")
    public ResponseEntity<SellShipQuoteDTO> getSellQuote(
            @PathVariable UUID playerShipId,
            @RequestParam UUID playerId,
            @RequestParam UUID sessionId) {
        return ResponseEntity.ok(usedShipMarketService.getSellQuote(playerShipId, playerId, sessionId));
    }

    @PostMapping("/{playerShipId}/sell")
    public ResponseEntity<SellShipResponseDTO> sellShip(
            @PathVariable UUID playerShipId,
            @RequestParam UUID playerId,
            @RequestParam UUID sessionId) {
        return ResponseEntity.ok(usedShipMarketService.sellShip(playerShipId, playerId, sessionId));
    }

    @GetMapping("/used")
    public ResponseEntity<List<UsedShipListingDTO>> getUsedShips(@RequestParam UUID sessionId) {
        return ResponseEntity.ok(usedShipMarketService.getAvailableUsedShips(sessionId));
    }

    @PostMapping("/used/{listingId}/buy/{playerId}")
    public ResponseEntity<PlayerShipDTO> buyUsedShip(
            @PathVariable UUID listingId,
            @PathVariable UUID playerId,
            @RequestParam UUID sessionId) {
        return ResponseEntity.ok(usedShipMarketService.buyUsedShip(listingId, playerId, sessionId));
    }

    @PostMapping("/{playerShipId}/refuel")
    public ResponseEntity<RefuelResponseDTO> refuelShip(
            @PathVariable UUID playerShipId,
            @RequestParam UUID playerId,
            @RequestParam UUID sessionId) {
        return ResponseEntity.ok(refuelShipService.refuel(playerShipId, playerId, sessionId));
    }

    @PostMapping("/{playerShipId}/repair")
    public ResponseEntity<RepairResponseDTO> repairShip(
            @PathVariable UUID playerShipId,
            @RequestParam UUID playerId,
            @RequestParam UUID sessionId) {
        return ResponseEntity.ok(repairShipService.repair(playerShipId, playerId, sessionId));
    }
}
