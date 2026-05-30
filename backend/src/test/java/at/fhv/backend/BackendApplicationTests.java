package at.fhv.backend;

import at.fhv.backend.config.TestDatasourceConfig;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@Import(TestDatasourceConfig.class)
@TestPropertySource(properties = {
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "spring.docker.compose.enabled=false"
})
class BackendApplicationTests {

    @Test
    void contextLoads() {
    }
}