package com.example.demo.security;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TokenBlacklistService {

    // Stores blacklisted token -> expiration timestamp
    private final Map<String, Long> blacklistedTokens = new ConcurrentHashMap<>();

    public void blacklistToken(String token, long expirationTimestampMs) {
        if (token != null && !token.trim().isEmpty()) {
            blacklistedTokens.put(token, expirationTimestampMs);
        }
    }

    public boolean isBlacklisted(String token) {
        if (token == null) return false;
        Long expiry = blacklistedTokens.get(token);
        if (expiry == null) return false;

        // If the token has naturally expired, purge it from memory
        if (System.currentTimeMillis() > expiry) {
            blacklistedTokens.remove(token);
            return false;
        }

        return true;
    }
}
