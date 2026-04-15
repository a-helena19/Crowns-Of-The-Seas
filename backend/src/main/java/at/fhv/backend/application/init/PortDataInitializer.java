package at.fhv.backend.application.init;

import at.fhv.backend.domain.model.port.Coordinates;
import at.fhv.backend.domain.model.port.Port;
import at.fhv.backend.domain.model.port.PortRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
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
                Port.create("Hamburg",      Coordinates.of(49.5, 22.0)),
                Port.create("Rotterdam",    Coordinates.of(47.8, 23.5)),
                Port.create("New York",     Coordinates.of(24.5, 29.0)),
                Port.create("Santos",       Coordinates.of(30.0, 57.0)),
                Port.create("Kapstadt",     Coordinates.of(51.5, 63.0)),
                Port.create("Mumbai",       Coordinates.of(65.0, 38.5)),
                Port.create("Singapur",     Coordinates.of(74.5, 46.5)),
                Port.create("Shanghai",     Coordinates.of(79.5, 30.5)),
                Port.create("Sydney",       Coordinates.of(84.0, 68.0)),
                Port.create("Los Angeles",  Coordinates.of(11.5, 33.0))
        );

        defaultPorts.forEach(portRepository::save);
    }
}
