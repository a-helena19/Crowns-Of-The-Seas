package at.fhv.backend.rest.dtos.session.request;

public record JoinSessionRequest(
        String gameCode,
        String playerName
) {}
