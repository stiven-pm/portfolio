package com.app.shared.config;

import jakarta.annotation.PostConstruct;
import org.flywaydb.core.Flyway;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.DependsOn;

import javax.sql.DataSource;
import java.sql.SQLException;

@Configuration
public class DatabaseConfig {

    private final DataSource dataSource;

    public DatabaseConfig(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @PostConstruct
    void createSchemas() {
        try (var conn = dataSource.getConnection();
             var stmt = conn.createStatement()) {
            stmt.execute("CREATE SCHEMA IF NOT EXISTS identity");
            stmt.execute("CREATE SCHEMA IF NOT EXISTS catalog");
            stmt.execute("CREATE SCHEMA IF NOT EXISTS products");
            stmt.execute("CREATE SCHEMA IF NOT EXISTS threads");
        } catch (SQLException e) {
            throw new IllegalStateException("Failed to create schemas", e);
        }
    }

    @Bean
    Flyway identityFlyway() {
        return migrate("identity");
    }

    @Bean
    @DependsOn("identityFlyway")
    Flyway catalogFlyway() {
        return migrate("catalog");
    }

    @Bean
    @DependsOn("catalogFlyway")
    Flyway productsFlyway() {
        return migrate("products");
    }

    @Bean
    @DependsOn("productsFlyway")
    Flyway threadsFlyway() {
        return migrate("threads");
    }

    private Flyway migrate(String schema) {
        var flyway = Flyway.configure()
                .dataSource(dataSource)
                .schemas(schema)
                .locations("classpath:db/migration/" + schema)
                .baselineOnMigrate(true)
                .baselineVersion("0")
                .load();
        flyway.migrate();
        return flyway;
    }
}
