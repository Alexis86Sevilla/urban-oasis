package com.urbanoasis.config;

import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

@Configuration
public class DataSourceConfig {

    private static final Logger log = LoggerFactory.getLogger(DataSourceConfig.class);

    @Value("${spring.datasource.url}")
    private String url;

    @Value("${spring.datasource.username}")
    private String username;

    @Value("${spring.datasource.password}")
    private String password;

    @Bean
    public DataSource dataSource() {
        String jdbcUrl = url;
        if (!jdbcUrl.startsWith("jdbc:")) {
            jdbcUrl = jdbcUrl
                    .replaceFirst("^postgresql://", "jdbc:postgresql://")
                    .replaceFirst("^postgres://", "jdbc:postgresql://");
        }

        // Remove embedded credentials so special characters in passwords
        // don't break JDBC URL parsing.
        String cleanUrl = jdbcUrl.replaceFirst("(://)[^@]+@", "$1");

        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl(cleanUrl);
        ds.setUsername(username);
        ds.setPassword(password);
        ds.setDriverClassName("org.postgresql.Driver");

        log.info("Configured DataSource for host: {}", maskUrl(cleanUrl));

        return ds;
    }

    private String maskUrl(String jdbcUrl) {
        return jdbcUrl.replaceFirst("(://)[^@]+@", "$1***@");
    }
}
