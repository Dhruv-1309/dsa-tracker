package com.example.demo.security;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class TokenBlacklistService {

    // Stores blacklisted token -> expiration timestamp
    private final Map<String, Long> blacklistedTokens = new ConcurrentHashMap<>();

    // Stores userId -> timestamp (ms) before which all issued tokens are revoked
    private final Map<String, Long> userRevocationCutoff = new ConcurrentHashMap<>();

    public void blacklistToken(String token, long expirationTimestampMs) {
        if (token != null && !token.trim().isEmpty()) {
            blacklistedTokens.put(token, expirationTimestampMs);
        }
    }

    public void revokeTokensForUserBefore(String userId, long cutoffTimestampMs) {
        if (userId != null && !userId.isBlank()) {
            userRevocationCutoff.put(userId, cutoffTimestampMs);
        }
    }

    public boolean isUserTokenRevoked(String userId, java.util.Date issuedAt) {
        if (userId == null || issuedAt == null) return false;
        Long cutoff = userRevocationCutoff.get(userId);
        if (cutoff == null) return false;
        // If the token was issued before the revocation cutoff (with a 1-second margin for clock skew), reject it
        return issuedAt.getTime() < cutoff;
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
