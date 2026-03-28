package at.fhv.backend.application.services.impl.travel;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

// Ship kennt Player nicht, deswegen erstmal ein Interface. Die echte Methode wird später aktualisiert und das Interface gelöscht
@Service
public interface PlayerHelper {
    BigDecimal getBalance(UUID playerId);
    void deductBalance(UUID playerId, BigDecimal amount);
}
