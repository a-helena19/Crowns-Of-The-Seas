package at.fhv.backend.application.init;

import at.fhv.backend.domain.model.cargo.Cargo;
import at.fhv.backend.domain.model.cargo.CargoRepository;
import at.fhv.backend.domain.model.cargo.CargoType;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Component
public class CargoDataInitializer implements ApplicationRunner {

    private final CargoRepository cargoRepository;

    public CargoDataInitializer(CargoRepository cargoRepository) {
        this.cargoRepository = cargoRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!cargoRepository.findAll().isEmpty()) {
            return;
        }

        List<Cargo> defaultCargos = List.of(
                Cargo.reconstruct(UUID.fromString("dd89316f-d736-41a8-a90b-458b84da7100"), "Fasswaren", "Verschiedene Fässer mit Alltagswaren. Geringes Risiko, stabile Nachfrage in jedem Hafen.", new BigDecimal("9000.00"), 20, CargoType.GENERAL_GOODS, 0.05),
                Cargo.reconstruct(UUID.fromString("f374ae63-2f8e-4303-bea9-e43fd4f6a070"), "Stoffballen", "Rollen aus Tuch und Leinen. Kompakt und leicht zu handhaben, gefragt auf allen Handelsrouten.", new BigDecimal("8670.00"), 18, CargoType.GENERAL_GOODS, 0.05),
                Cargo.reconstruct(UUID.fromString("8731ac92-7d47-4527-905b-b5d90b6fdb54"), "Tonkeramik", "Kisten mit alltäglicher Keramikware. Sperrig, aber günstig zu versichern.", new BigDecimal("9200.00"), 22, CargoType.GENERAL_GOODS, 0.07),
                Cargo.reconstruct(UUID.fromString("99112fd8-6693-4e80-815c-fb98a1e69f43"), "Salzfisch", "Fässer mit gepökeltem Kabeljau und Hering. Verdirbt schnell — zügig liefern.", new BigDecimal("14000.00"), 15, CargoType.FOOD, 0.08),
                Cargo.reconstruct(UUID.fromString("d5dfc128-bd3f-4bb4-b31a-b7f8a6b18454"), "Getreidesäcke", "Scheffel voll Weizen und Roggen. Schwer, aber in jedem Hafen gebraucht.", new BigDecimal("11000.00"), 25, CargoType.FOOD, 0.06),
                Cargo.reconstruct(UUID.fromString("ad6ce61f-2e1a-4ed6-932a-804671c46a90"), "Gewürztruhen", "Zimt, Pfeffer und Nelken. Leichte Fracht mit überraschend hoher Gewinnspanne.", new BigDecimal("19200.00"), 10, CargoType.FOOD, 0.09),
                Cargo.reconstruct(UUID.fromString("2c85344b-2bb0-48d6-84e0-d165251076ea"), "Kupferbarren", "Rohes, raffiniertes Kupfer für die Gießerei. Schwer und wertvoll.", new BigDecimal("18300.00"), 35, CargoType.INDUSTRIAL_GOODS, 0.1),
                Cargo.reconstruct(UUID.fromString("63f0e6c5-27a0-4435-a74c-c079c7d87aea"), "Holzplanken", "Abgelagertes Eichenholz für Schiffsbauer und Zimmerleute. Sperrig, aber sehr gefragt.", new BigDecimal("12000.00"), 40, CargoType.INDUSTRIAL_GOODS, 0.08),
                Cargo.reconstruct(UUID.fromString("e79b900a-9f61-474e-b395-f7f7c09188ba"), "Tauwerk & Takelage", "Aufgerolltes Hanfseil und Eisenbeschläge — das Rückgrat jeder Flotte.", new BigDecimal("13600.00"), 28, CargoType.INDUSTRIAL_GOODS, 0.09),
                Cargo.reconstruct(UUID.fromString("491a7fcf-cbcf-41a3-9ffd-54273ca9e2e4"), "Navigationsinstrumente", "Sextanten, Chronometer und Kompasse aus den feinsten Werkstätten. Mit Vorsicht behandeln.", new BigDecimal("7800.00"), 12, CargoType.ELECTRONICS, 0.14),
                Cargo.reconstruct(UUID.fromString("54ec7ea5-9d62-4391-b78e-89f9d1357e30"), "Signalapparate", "Optische Telegrafenteile und Signallampen. Zerbrechlich und proprietär.", new BigDecimal("8500.00"), 14, CargoType.ELECTRONICS, 0.16),
                Cargo.reconstruct(UUID.fromString("b175d489-8804-439c-9d92-351d4d3c387e"), "Uhrwerke", "Präzisionsgetriebe für Uhrmacher und Automatenbauer.", new BigDecimal("7200.00"), 10, CargoType.ELECTRONICS, 0.15),
                Cargo.reconstruct(UUID.fromString("1ed3e6f9-f2f6-4342-97a6-4cee883759af"), "Venezianisches Glas", "Handgeblasenes Glas aus Murano. Eine raue Welle kann teuer werden.", new BigDecimal("6800.00"), 8, CargoType.FRAGILE, 0.2),
                Cargo.reconstruct(UUID.fromString("831395ed-6b47-420c-a2d3-c2420495e60c"), "Porzellanservice", "Kaiserliches Porzellanservice — jeder Bruch mindert die Auszahlung erheblich.", new BigDecimal("7300.00"), 10, CargoType.FRAGILE, 0.22),
                Cargo.reconstruct(UUID.fromString("9e98cbe5-bbbd-4de3-ad29-7d9b08ead7e8"), "Observatoriumslinsen", "Geschliffenes optisches Glas für Teleskope. Unersetzlich bei Verlust.", new BigDecimal("760.00"), 6, CargoType.FRAGILE, 0.24),
                Cargo.reconstruct(UUID.fromString("a84dda43-b31c-49f5-8bc7-fa9d62db47f2"), "Schwarzpulverfässer", "Militärisches Schießpulver. Sorgfältige Lagerung fern von Hitze und Funken erforderlich.", new BigDecimal("9000.00"), 18, CargoType.HAZARDOUS, 0.35),
                Cargo.reconstruct(UUID.fromString("0ee1ee52-f383-49b8-a9dd-887c744979df"), "Alchemistische Reagenzien", "Flüchtige Verbindungen für Apotheker und Färbereien. Klassifiziertes Manifest erforderlich.", new BigDecimal("9600.00"), 14, CargoType.HAZARDOUS, 0.38),
                Cargo.reconstruct(UUID.fromString("4b7037c1-9cdd-4528-8c70-d9c45d877d1b"), "Säureballons", "Große Glasballons mit Industriesäure in Strohkisten verpackt. Auslaufen wäre katastrophal.", new BigDecimal("10200.00"), 16, CargoType.HAZARDOUS, 0.4),
                Cargo.reconstruct(UUID.fromString("0b0af1dc-420d-40a2-bf42-515de083dba7"), "Goldbarren", "Gestempelte Goldbarren aus der königlichen Münze. Außergewöhnlicher Wert — und außergewöhnliches Risiko. Nur Schiffe ab der Klasse Standard verfügen über die nötige Ladekapazität.", new BigDecimal("18000.00"), 70, CargoType.LUXURY_GOODS, 0.3),
                Cargo.reconstruct(UUID.fromString("fb0d2f79-22fd-4db9-bae9-45d853d7fd2b"), "Seltene Gemälde", "Eine private Sammlung von Ölgemälden für einen fernen Mäzen. Unbezahlbar bei intakter Lieferung. Nur Schiffe ab der Klasse Standard verfügen über die nötige Ladekapazität.", new BigDecimal("16500.00"), 65, CargoType.LUXURY_GOODS, 0.28),
                Cargo.reconstruct(UUID.fromString("b8f00832-2e31-45f7-9d04-97bc1f14f552"), "Exotische Seidenrollen", "Feinste Seide aus dem Fernen Osten, in Farben gefärbt, die auf europäischen Märkten unbekannt sind. Nur Schiffe ab der Klasse Standard verfügen über die nötige Ladekapazität.", new BigDecimal("15000.00"), 60, CargoType.LUXURY_GOODS, 0.25)
        );

        defaultCargos.forEach(cargoRepository::save);
    }
}
