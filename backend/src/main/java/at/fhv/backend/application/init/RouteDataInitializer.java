package at.fhv.backend.application.init;

import at.fhv.backend.domain.model.port.Coordinates;
import at.fhv.backend.domain.model.port.Port;
import at.fhv.backend.domain.model.port.PortRepository;
import at.fhv.backend.domain.model.route.Route;
import at.fhv.backend.domain.model.route.RouteRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@Order(2)
public class RouteDataInitializer implements ApplicationRunner {
    private final PortRepository portRepository;
    private final RouteRepository routeRepository;

    public RouteDataInitializer(PortRepository portRepository, RouteRepository routeRepository) {
        this.portRepository = portRepository;
        this.routeRepository = routeRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!routeRepository.findAll().isEmpty()) {
            return;
        }

        List<Port> ports = portRepository.findAll();
        if (ports.size() < 2) {
            return;
        }

        for (int i = 0; i < ports.size(); i++) {
            for (int j = i + 1; j < ports.size(); j++) {
                Port a = ports.get(i);
                Port b = ports.get(j);

                Coordinates originCoords = a.getCoordinates();
                Coordinates destCoords = b.getCoordinates();
                List<Coordinates> waypoints = RoutePathfinder.findRoute(originCoords, destCoords);

                if (waypoints.isEmpty()) {
                    continue;
                }

                String description = RoutePathfinder.getRouteDescription(a.getName(), b.getName());


                Route route = Route.create(
                        a.getId().getValue(),
                        b.getId().getValue(),
                        originCoords,
                        destCoords,
                        waypoints,
                        description
                );
                routeRepository.save(route);
            }
        }

        System.out.println("[RouteDataInitializer] Seeded " + routeRepository.findAll().size() + " routes.");
    }
}