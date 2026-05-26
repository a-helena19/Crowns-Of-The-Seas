package at.fhv.backend.domain.model.customs.exception;

import at.fhv.backend.domain.model.customs.CustomsInspectionStatus;
import at.fhv.backend.domain.model.exception.DomainException;
import at.fhv.backend.domain.model.exception.ErrorCode;

import java.util.UUID;

public class CustomsInspectionInvalidStateException extends DomainException {
    public CustomsInspectionInvalidStateException(UUID inspectionId, CustomsInspectionStatus currentStatus) {
        super("Customs inspection " + inspectionId + " is not awaiting a decision (current status: " + currentStatus + ")",
                ErrorCode.CUSTOMS_INSPECTION_INVALID_STATE);
    }
}
