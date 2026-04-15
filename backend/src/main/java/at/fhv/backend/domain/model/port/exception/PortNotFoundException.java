package at.fhv.backend.domain.model.port.exception;

import at.fhv.backend.domain.model.port.PortId;

public class PortNotFoundException extends RuntimeException {
    public PortNotFoundException(PortId portId) {
        super("Port not found: " + portId.getValue());
    }
}
