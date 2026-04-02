package at.fhv.backend.rest.dtos.session.request;

import java.util.UUID;

public record AssignFactionRequest(
        UUID userId,
        String faction
) {}
