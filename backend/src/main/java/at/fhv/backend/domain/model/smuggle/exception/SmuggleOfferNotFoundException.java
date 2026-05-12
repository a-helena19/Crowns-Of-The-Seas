package at.fhv.backend.domain.model.smuggle.exception;

import at.fhv.backend.domain.model.exception.DomainException;
import at.fhv.backend.domain.model.exception.ErrorCode;

import java.util.UUID;

public class SmuggleOfferNotFoundException extends DomainException {
    public SmuggleOfferNotFoundException(UUID offerId) {
        super("Smuggle offer not found: " + offerId, ErrorCode.SMUGGLE_NOT_FOUND);
    }
}
