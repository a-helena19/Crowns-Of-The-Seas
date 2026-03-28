package at.fhv.backend.application.services.impl.travel;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.UUID;

// dummy daten, wird später gelöscht
@Service
public class PlayerHelperImpl implements  PlayerHelper{
    @Override
    public BigDecimal getBalance(UUID playerId) {
        return new BigDecimal("100000");
    }

    @Override
    public void deductBalance(UUID playerId, BigDecimal amount) {
        System.out.println("Deducted: " + amount);
    }
}
