package at.fhv.backend.domain.model.customs.exception;

import at.fhv.backend.domain.model.exception.DomainException;
import at.fhv.backend.domain.model.exception.ErrorCode;

import java.util.UUID;

public class CustomsInspectionNotFoundException extends DomainException {
    public CustomsInspectionNotFoundException(UUID inspectionId) {
        super("Customs inspection not found: " + inspectionId, ErrorCode.CUSTOMS_INSPECTION_NOT_FOUND);
    }
}
