package at.fhv.backend.domain.model.user;

import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.*;

class UserTest {

    @Test
    void givenRegister_whenCreated_thenRoleIsUser() {
        User user = User.register(UUID.randomUUID(), "player1", "hash123");

        assertThat(user.getRole()).isEqualTo("USER");
        assertThat(user.isAdmin()).isFalse();
    }

    @Test
    void givenRegisterAdmin_whenCreated_thenRoleIsAdmin() {
        User admin = User.registerAdmin(UUID.randomUUID(), "admin", "hash123");

        assertThat(admin.getRole()).isEqualTo("ADMIN");
        assertThat(admin.isAdmin()).isTrue();
    }

    @Test
    void givenReconstruct_whenCalledWithRole_thenRoleIsPreserved() {
        UUID id = UUID.randomUUID();
        User user = User.reconstruct(id, "testuser", "hash", "ADMIN");

        assertThat(user.getId()).isEqualTo(id);
        assertThat(user.getUsername()).isEqualTo("testuser");
        assertThat(user.getRole()).isEqualTo("ADMIN");
        assertThat(user.isAdmin()).isTrue();
    }

    @Test
    void givenReconstructWithUserRole_thenIsAdminReturnsFalse() {
        User user = User.reconstruct(UUID.randomUUID(), "player", "hash", "USER");

        assertThat(user.isAdmin()).isFalse();
    }

    @Test
    void givenRegister_thenFieldsAreSetCorrectly() {
        UUID id = UUID.randomUUID();
        User user = User.register(id, "captain", "secrethash");

        assertThat(user.getId()).isEqualTo(id);
        assertThat(user.getUsername()).isEqualTo("captain");
        assertThat(user.getPasswordHash()).isEqualTo("secrethash");
    }
}