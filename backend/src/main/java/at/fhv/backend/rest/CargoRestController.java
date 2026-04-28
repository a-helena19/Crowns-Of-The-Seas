package at.fhv.backend.rest;

import at.fhv.backend.application.services.cargo.AcceptCargoService;
import at.fhv.backend.application.services.cargo.CargoQueryService;
import at.fhv.backend.domain.model.cargo.SessionCargo;
import at.fhv.backend.domain.model.cargo.SessionCargoRepository;
import at.fhv.backend.domain.model.cargo.exception.CargoNotFoundException;
import at.fhv.backend.domain.model.exception.ShipNotFoundException;
import at.fhv.backend.domain.model.player.ISessionPlayer;
import at.fhv.backend.domain.model.player.SessionPlayerRepository;
import at.fhv.backend.domain.model.player.exception.PlayerNotFoundException;
import at.fhv.backend.domain.model.session.GameSession;
import at.fhv.backend.domain.model.session.GameSessionRepository;
import at.fhv.backend.domain.model.session.exception.SessionNotFoundException;
import at.fhv.backend.domain.model.ship.PlayerShip;
import at.fhv.backend.domain.model.ship.PlayerShipRepository;
import at.fhv.backend.rest.dtos.cargo.request.AcceptCargoRequest;
import at.fhv.backend.rest.dtos.cargo.response.LoadingStartResponse;
import at.fhv.backend.rest.dtos.cargo.response.SessionCargoDTO;
import at.fhv.backend.rest.exception.ErrorResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/cargo")
public class CargoRestController {
    private final CargoQueryService cargoQueryService;
    private final AcceptCargoService acceptCargoService;
    private final SessionPlayerRepository sessionPlayerRepository;
    private final PlayerShipRepository playerShipRepository;
    private final GameSessionRepository gameSessionRepository;
    private final SessionCargoRepository sessionCargoRepository;


    public CargoRestController(CargoQueryService cargoQueryService, AcceptCargoService acceptCargoService,
                               SessionPlayerRepository sessionPlayerRepository, PlayerShipRepository playerShipRepository,
                               GameSessionRepository gameSessionRepository, SessionCargoRepository sessionCargoRepository) {
        this.cargoQueryService = cargoQueryService;
        this.acceptCargoService = acceptCargoService;
        this.sessionPlayerRepository = sessionPlayerRepository;
        this.playerShipRepository = playerShipRepository;
        this.gameSessionRepository = gameSessionRepository;
        this.sessionCargoRepository = sessionCargoRepository;
    }

    @GetMapping("/{sessionId}/available")
    public ResponseEntity<List<SessionCargoDTO>> getAvailable(
            @PathVariable UUID sessionId,
            @RequestParam UUID portId) {
        return ResponseEntity.ok(cargoQueryService.getAvailableCargos(sessionId, portId));
    }

    @GetMapping("/offer/{sessionCargoId}")
    public ResponseEntity<SessionCargoDTO> getById(@PathVariable UUID sessionCargoId) {
        return ResponseEntity.ok(cargoQueryService.getCargoById(sessionCargoId));
    }

    @PostMapping("/accept")
    public ResponseEntity<?> acceptCargo(
            @RequestParam UUID playerId,
            @RequestParam UUID sessionId,
            @RequestBody AcceptCargoRequest request) {
        try {

            SessionCargoDTO cargoDto = acceptCargoService.acceptCargo(playerId, sessionId, request);

            PlayerShip playerShip = playerShipRepository
                    .findByIdAndPlayerIdAndSessionId(request.getPlayerShipId(), playerId, sessionId)
                    .orElseThrow(() -> new RuntimeException("PlayerShip not found"));

            GameSession session = gameSessionRepository.findById(sessionId)
                    .orElseThrow(() -> new RuntimeException("Session not found"));


            int loadingCompletedAtTick = playerShip.getLoadingCompletedAtTick();
            int currentTick = session.getCurrentTick();
            double loadingDurationSeconds = (loadingCompletedAtTick - currentTick) * session.getTickRateSeconds();

            LoadingStartResponse response = new LoadingStartResponse();
            response.setCargoId(cargoDto.getId().toString());
            response.setLoadingDurationSeconds(loadingDurationSeconds);
            response.setLoadingCompletedAtTick(loadingCompletedAtTick);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage(), "ACCEPT_CARGO_FAILED"));
        }
    }
}
