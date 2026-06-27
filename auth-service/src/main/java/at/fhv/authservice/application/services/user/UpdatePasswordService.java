package at.fhv.authservice.application.services.user;

import at.fhv.authservice.rest.dtos.user.ChangePasswordRequestDTO;

import java.util.UUID;

public interface UpdatePasswordService {
    void updatePassword(UUID userId, ChangePasswordRequestDTO request);
}
