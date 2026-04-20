package at.fhv.backend.infrastructure.persistence.cargo;

import at.fhv.backend.domain.model.cargo.Cargo;
import at.fhv.backend.domain.model.cargo.CargoRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
@Transactional
public class CargoRepositoryImpl implements CargoRepository {
    private final CargoJpaRepository cargoJpaRepository;

    public CargoRepositoryImpl(CargoJpaRepository cargoJpaRepository) {
        this.cargoJpaRepository = cargoJpaRepository;
    }

    @Override
    public Cargo save(Cargo c) {
        CargoEntity e = new CargoEntity();
        e.setId(c.getId()); e.setName(c.getName()); e.setDescription(c.getDescription());
        e.setBaseReward(c.getBaseReward()); e.setCapacity(c.getCapacity());
        e.setCargoType(c.getCargoType()); e.setRisk(c.getRisk());
        return toD(cargoJpaRepository.save(e));
    }

    @Override
    public Optional<Cargo> findById(UUID id) {
        return cargoJpaRepository.findById(id).map(this::toD);
    }

    @Override
    public List<Cargo> findAll() {
        return cargoJpaRepository.findAll().stream().map(this::toD).collect(Collectors.toList());
    }

    private Cargo toD(CargoEntity e) {
        return Cargo.reconstruct(e.getId(), e.getName(), e.getDescription(), e.getBaseReward(), e.getCapacity(), e.getCargoType(), e.getRisk());
    }
}
