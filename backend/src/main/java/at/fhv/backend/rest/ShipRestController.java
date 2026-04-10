package at.fhv.backend.rest;

import at.fhv.backend.application.dtos.request.BuyShipDTO;
import at.fhv.backend.application.dtos.response.PlayerShipDTO;
import at.fhv.backend.application.dtos.response.ShipDTO;
import at.fhv.backend.application.services.ship.PurchaseShipService;
import at.fhv.backend.application.services.ship.ShipQueryService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api/ships")
public class ShipRestController {
    private final ShipQueryService shipQueryService;
    private final PurchaseShipService purchaseShipService;

    public ShipRestController(ShipQueryService shipQueryService, PurchaseShipService purchaseShipService) {
        this.shipQueryService = shipQueryService;
        this.purchaseShipService = purchaseShipService;
    }


    @GetMapping("/player/{playerId}")
    public ResponseEntity<List<PlayerShipDTO>> getPlayerShips(
            @PathVariable UUID playerId,
            HttpServletRequest request) {

        UUID sessionId = (UUID) request.getAttribute("sessionId");

        return ResponseEntity.ok(
                shipQueryService.getPlayerShips(playerId, sessionId)
        );
    }

    @GetMapping("/{playerShipId}/player/{playerId}")
    public ResponseEntity<PlayerShipDTO> getPlayerShip(@PathVariable UUID playerShipId, @PathVariable UUID playerId) {
        return ResponseEntity.ok(shipQueryService.getPlayerShip(playerShipId, playerId));
    }

    @GetMapping
    public ResponseEntity<List<ShipDTO>> getShipsByClass(@RequestParam(required = false) String shipClass) {
        return ResponseEntity.ok(shipQueryService.getMarketShips(shipClass));
    }

    @GetMapping("/player/{playerId}/balance")
    public ResponseEntity<BigDecimal> getPlayerBalance(
            @PathVariable UUID playerId,
            HttpServletRequest request) {
        UUID sessionId = (UUID) request.getAttribute("sessionId"); // falls JwtFilter das setzt
        return ResponseEntity.ok(purchaseShipService.getBalanceByPlayerId(playerId, sessionId));
    }


    @PostMapping("/buy/{playerId}")
    public ResponseEntity<PlayerShipDTO> buyShip(
            @PathVariable UUID playerId,
            @RequestBody BuyShipDTO request,
            HttpServletRequest httpRequest) {

        UUID sessionId = (UUID) httpRequest.getAttribute("sessionId");

        return ResponseEntity.ok(
                purchaseShipService.buyShip(playerId, sessionId, request)
        );
    }

}
