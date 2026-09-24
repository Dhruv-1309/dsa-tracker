package com.example.demo.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class EnvironmentValidator {

    @Value("${application.security.jwt.secret-key:#{null}}")
    private String jwtSecret;

    @Value("${spring.datasource.password:#{null}}")
    private String dbPassword;

    @Value("${spring.datasource.url:#{null}}")
    private String dbUrl;

    @PostConstruct
    public void validateCriticalVariables() {
        if (jwtSecret == null || jwtSecret.trim().isEmpty()) {
            throw new IllegalStateException(
                "CRITICAL SECURITY CONFIGURATION ERROR: 'JWT_SECRET_KEY' environment variable is missing or blank. " +
                "The application will not start without a secure signing key. " +
                "Please set JWT_SECRET_KEY in your environment or .env file (e.g. openssl rand -base64 32)."
            );
        }

        if (jwtSecret.trim().length() < 32) {
            throw new IllegalStateException(
                "CRITICAL SECURITY CONFIGURATION ERROR: 'JWT_SECRET_KEY' is too short (minimum 32 characters for 256-bit HMAC-SHA256). " +
                "Please generate a cryptographically secure key (e.g. openssl rand -base64 32)."
            );
        }

        if (dbPassword == null || dbPassword.trim().isEmpty()) {
            throw new IllegalStateException(
                "CRITICAL SECURITY CONFIGURATION ERROR: Database password is missing or blank. " +
                "The application refuses to start with an unauthenticated or default database configuration. " +
                "Please set SPRING_DATASOURCE_PASSWORD or DB_PASSWORD."
            );
        }

        if (dbUrl == null || dbUrl.trim().isEmpty()) {
            throw new IllegalStateException(
                "CRITICAL CONFIGURATION ERROR: Database URL is missing. " +
                "Please set SPRING_DATASOURCE_URL, DATABASE_URL, or DB_HOST."
            );
        }
    }
}
