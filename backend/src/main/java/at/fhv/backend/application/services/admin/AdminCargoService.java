package at.fhv.backend.application.services.admin;

import at.fhv.backend.rest.dtos.admin.AdminCargoDTO;
import java.util.List;
import java.util.UUID;

public interface AdminCargoService {
    List<AdminCargoDTO> getAllCargos();
    AdminCargoDTO createCargo(AdminCargoDTO dto);
    AdminCargoDTO updateCargo(UUID id, AdminCargoDTO dto);
    void deleteCargo(UUID id);
}