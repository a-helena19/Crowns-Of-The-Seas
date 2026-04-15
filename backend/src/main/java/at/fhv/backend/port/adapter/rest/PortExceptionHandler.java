package at.fhv.backend.port.adapter.rest;

import at.fhv.backend.port.domain.exception.PortNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class PortExceptionHandler {

    @ExceptionHandler(PortNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public String handlePortNotFound(PortNotFoundException ex) {
        return ex.getMessage();
    }
}
