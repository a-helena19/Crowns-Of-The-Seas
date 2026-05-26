package at.fhv.backend.application.services.admin;

import at.fhv.backend.rest.dtos.admin.AdminShipDTO;
import java.util.List;
import java.util.UUID;

public interface AdminShipService {
    List<AdminShipDTO> getAllShips();
    AdminShipDTO createShip(AdminShipDTO dto);
    AdminShipDTO updateShip(UUID id, AdminShipDTO dto);
    void deleteShip(UUID id);
}