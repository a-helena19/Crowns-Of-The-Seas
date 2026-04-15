package at.fhv.backend.port.domain.exception;

import at.fhv.backend.port.domain.model.PortId;

public class PortNotFoundException extends RuntimeException {
    public PortNotFoundException(PortId portId) {
        super("Port not found: " + portId.getValue());
    }
}
