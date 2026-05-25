package at.fhv.backend.application.init;

import at.fhv.backend.domain.model.port.Coordinates;
import at.fhv.backend.domain.model.port.Port;
import at.fhv.backend.domain.model.port.PortRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Order(1)
public class PortDataInitializer implements ApplicationRunner {

    private final PortRepository portRepository;

    public PortDataInitializer(PortRepository portRepository) {
        this.portRepository = portRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!portRepository.findAll().isEmpty()) {
            return;
        }

        List<Port> defaultPorts = List.of(
                Port.create("Hamburg",      Coordinates.of(47.1, 28.6)),
                Port.create("New York",     Coordinates.of(26.1, 37.7)),
                Port.create("Santos",       Coordinates.of(33.9, 71.4)),
                Port.create("Kapstadt",     Coordinates.of(50.0, 77.1)),
                Port.create("Mumbai",       Coordinates.of(63.7, 50.0)),
                Port.create("Singapur",     Coordinates.of(70.9, 58.0)),
                Port.create("Shanghai",     Coordinates.of(75.0, 43.0)),
                Port.create("Sydney",       Coordinates.of(82.1, 80.2)),
                Port.create("Los Angeles",  Coordinates.of(15.4, 40.2))
        );

        defaultPorts.forEach(portRepository::save);
    }
}
