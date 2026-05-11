package at.fhv.backend.domain.model.player;

import at.fhv.backend.domain.model.player.exception.InsufficientBalanceException;
import at.fhv.backend.domain.model.player.exception.InvalidAmountException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

class BaseSessionPlayerTest {

    private UUID userId;
    private UUID sessionId;
    private BaseSessionPlayer player;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        sessionId = UUID.randomUUID();
        player = new BaseSessionPlayer(userId, sessionId, "Alice", false);
    }

    // Konstruktor / Initialzustand

    @Test
    void givenNewPlayer_thenStartBalanceIs40000() {
        assertThat(player.getBalance()).isEqualByComparingTo(new BigDecimal("40000.00"));
    }

    @Test
    void givenNewPlayer_thenIdIsGenerated() {
        assertThat(player.getId()).isNotNull();
    }

    @Test
    void givenNewPlayer_thenFieldsAreSetCorrectly() {
        assertThat(player.getUserId()).isEqualTo(userId);
        assertThat(player.getSessionId()).isEqualTo(sessionId);
        assertThat(player.getPlayerName()).isEqualTo("Alice");
        assertThat(player.isHost()).isFalse();
    }

    @Test
    void givenHostPlayer_thenIsHostIsTrue() {
        BaseSessionPlayer host = new BaseSessionPlayer(userId, sessionId, "Host", true);
        assertThat(host.isHost()).isTrue();
    }

    // hasSufficientBalance

    @Test
    void givenSufficientBalance_whenCheckSufficiency_thenTrue() {
        assertThat(player.hasSufficientBalance(new BigDecimal("100.00"))).isTrue();
    }

    @Test
    void givenExactBalance_whenCheckSufficiency_thenTrue() {
        assertThat(player.hasSufficientBalance(new BigDecimal("40000.00"))).isTrue();
    }

    @Test
    void givenInsufficientBalance_whenCheckSufficiency_thenFalse() {
        assertThat(player.hasSufficientBalance(new BigDecimal("40000.01"))).isFalse();
    }

    // addBalance

    @Test
    void givenPositiveAmount_whenAddBalance_thenBalanceIncreases() {
        player.addBalance(new BigDecimal("500.00"));
        assertThat(player.getBalance()).isEqualByComparingTo(new BigDecimal("40500.00"));
    }

    @Test
    void givenZeroAmount_whenAddBalance_thenThrowsInvalidAmountException() {
        assertThatThrownBy(() -> player.addBalance(BigDecimal.ZERO))
                .isInstanceOf(InvalidAmountException.class);
    }

    @Test
    void givenNegativeAmount_whenAddBalance_thenThrowsInvalidAmountException() {
        assertThatThrownBy(() -> player.addBalance(new BigDecimal("-100.00")))
                .isInstanceOf(InvalidAmountException.class);
    }

    @Test
    void givenMultipleAdds_whenAddBalance_thenBalanceAccumulates() {
        player.addBalance(new BigDecimal("1000.00"));
        player.addBalance(new BigDecimal("500.00"));
        assertThat(player.getBalance()).isEqualByComparingTo(new BigDecimal("41500.00"));
    }

    // subtractBalance

    @Test
    void givenSufficientBalance_whenSubtractBalance_thenBalanceDecreases() {
        player.subtractBalance(new BigDecimal("1000.00"));
        assertThat(player.getBalance()).isEqualByComparingTo(new BigDecimal("39000.00"));
    }

    @Test
    void givenExactBalance_whenSubtractAll_thenBalanceIsZero() {
        player.subtractBalance(new BigDecimal("40000.00"));
        assertThat(player.getBalance()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void givenInsufficientBalance_whenSubtractBalance_thenThrowsInsufficientBalanceException() {
        assertThatThrownBy(() -> player.subtractBalance(new BigDecimal("99999.00")))
                .isInstanceOf(InsufficientBalanceException.class);
    }

    @Test
    void givenSubtractThenAdd_thenBalanceIsCorrect() {
        player.subtractBalance(new BigDecimal("5000.00"));
        player.addBalance(new BigDecimal("2000.00"));
        assertThat(player.getBalance()).isEqualByComparingTo(new BigDecimal("37000.00"));
    }

    //  Modifikatoren (alle 1.0 bei BaseSessionPlayer)

    @Test
    void givenBasePlayer_thenAllCostModifiersAreNeutral() {
        assertThat(player.getRepairCostModifier()).isEqualTo(1.0);
        assertThat(player.getFuelCostModifier()).isEqualTo(1.0);
        assertThat(player.getSmuggleRiskModifier()).isEqualTo(1.0);
        assertThat(player.getCustomsRiskModifier()).isEqualTo(1.0);
    }

    @Test
    void givenBasePlayer_thenAllTimeModifiersAreNeutral() {
        assertThat(player.getRepairTimeModifier()).isEqualTo(1.0);
        assertThat(player.getFuelTimeModifier()).isEqualTo(1.0);
        assertThat(player.getLoadingTimeModifier()).isEqualTo(1.0);
        assertThat(player.getUnloadingTimeModifier()).isEqualTo(1.0);
    }

    @Test
    void givenBasePlayer_thenAllGameplayModifiersAreNeutral() {
        assertThat(player.getMiniGameRiskModifier()).isEqualTo(1.0);
        assertThat(player.getEarlyOrderDetectionModifier()).isEqualTo(1.0);
        assertThat(player.getMarketOfferModifier()).isEqualTo(1.0);
        assertThat(player.getMarketOfferQuantityModifier()).isEqualTo(1.0);
    }

    //  reconstruct

    @Test
    void givenReconstructedPlayer_thenFieldsMatch() {
        UUID id = UUID.randomUUID();
        BigDecimal balance = new BigDecimal("12345.67");
        BaseSessionPlayer reconstructed = BaseSessionPlayer.reconstruct(
                id, userId, sessionId, "Bob", true, balance, null);

        assertThat(reconstructed.getId()).isEqualTo(id);
        assertThat(reconstructed.getUserId()).isEqualTo(userId);
        assertThat(reconstructed.getSessionId()).isEqualTo(sessionId);
        assertThat(reconstructed.getPlayerName()).isEqualTo("Bob");
        assertThat(reconstructed.isHost()).isTrue();
        assertThat(reconstructed.getBalance()).isEqualByComparingTo(balance);
    }
}
