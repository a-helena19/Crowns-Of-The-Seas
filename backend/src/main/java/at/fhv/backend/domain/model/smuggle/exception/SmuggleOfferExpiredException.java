package at.fhv.backend.domain.model.smuggle.exception;

import at.fhv.backend.domain.model.exception.DomainException;
import at.fhv.backend.domain.model.exception.ErrorCode;

import java.util.UUID;

public class SmuggleOfferExpiredException extends DomainException {
    public SmuggleOfferExpiredException(UUID offerId) {
        super("Smuggle offer expired " + offerId, ErrorCode.SMUGGLE_EXPIRED);
    }
}
