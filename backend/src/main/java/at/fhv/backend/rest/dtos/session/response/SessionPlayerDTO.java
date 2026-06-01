package at.fhv.backend.rest.dtos.session.response;

import at.fhv.backend.domain.model.player.ISessionPlayer;
import at.fhv.backend.domain.model.player.PlayerFaction;

import java.util.UUID;

public record SessionPlayerDTO(
        UUID id,
        UUID userId,
        String playerName,
        boolean isHost,
        String faction,
        UUID homePortId,
        boolean disconnected
) {}