package at.fhv.authservice.application.services.user;

import at.fhv.authservice.rest.dtos.user.DeleteAccountRequestDTO;

import java.util.UUID;

public interface DeleteUserService {
    void deleteUser(UUID userId, DeleteAccountRequestDTO request);
}
