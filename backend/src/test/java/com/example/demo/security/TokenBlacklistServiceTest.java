package com.example.demo.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Date;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class TokenBlacklistServiceTest {

    private TokenBlacklistService blacklistService;

    @BeforeEach
    void setUp() {
        blacklistService = new TokenBlacklistService();
    }

    @Test
    @DisplayName("blacklistToken stores token until expiry")
    void testTokenBlacklist() {
        String token = "sample.jwt.token";
        assertFalse(blacklistService.isBlacklisted(token));

        long futureExpiry = System.currentTimeMillis() + 60_000L;
        blacklistService.blacklistToken(token, futureExpiry);
        assertTrue(blacklistService.isBlacklisted(token));

        // Expired token is cleaned up and returns false
        String expiredToken = "expired.jwt.token";
        blacklistService.blacklistToken(expiredToken, System.currentTimeMillis() - 1000L);
        assertFalse(blacklistService.isBlacklisted(expiredToken));
    }

    @Test
    @DisplayName("revokeTokensForUserBefore revokes all tokens issued before cutoff timestamp")
    void testUserTokenRevocation() {
        String userId = UUID.randomUUID().toString();
        long now = System.currentTimeMillis();

        Date oldTokenIssueTime = new Date(now - 10_000L);
        Date newTokenIssueTime = new Date(now + 10_000L);

        // Before revocation, tokens are not revoked
        assertFalse(blacklistService.isUserTokenRevoked(userId, oldTokenIssueTime));
        assertFalse(blacklistService.isUserTokenRevoked(userId, newTokenIssueTime));

        // Revoke tokens issued before 'now'
        blacklistService.revokeTokensForUserBefore(userId, now);

        // Old token should now be revoked
        assertTrue(blacklistService.isUserTokenRevoked(userId, oldTokenIssueTime));

        // Token issued after cutoff should remain valid
        assertFalse(blacklistService.isUserTokenRevoked(userId, newTokenIssueTime));
    }
}
