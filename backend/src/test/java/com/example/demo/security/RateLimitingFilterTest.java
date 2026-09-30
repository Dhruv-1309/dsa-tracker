package com.example.demo.security;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class RateLimitingFilterTest {

    private RateLimitingFilter filter;
    private FilterChain filterChain;

    @BeforeEach
    void setUp() {
        filter = new RateLimitingFilter();
        filterChain = mock(FilterChain.class);
    }

    @Test
    @DisplayName("POST /api/auth/login allows 5 attempts, blocks 6th with 429")
    void testLoginRateLimit() throws Exception {
        for (int i = 1; i <= 5; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
            request.setRemoteAddr("192.168.1.10");
            MockHttpServletResponse response = new MockHttpServletResponse();

            filter.doFilterInternal(request, response, filterChain);
            assertThat(response.getStatus()).isEqualTo(200);
        }

        // 6th attempt should be blocked
        MockHttpServletRequest blockedRequest = new MockHttpServletRequest("POST", "/api/auth/login");
        blockedRequest.setRemoteAddr("192.168.1.10");
        MockHttpServletResponse blockedResponse = new MockHttpServletResponse();

        filter.doFilterInternal(blockedRequest, blockedResponse, filterChain);
        assertThat(blockedResponse.getStatus()).isEqualTo(429);
        assertThat(blockedResponse.getContentAsString()).contains("Too many authentication attempts");
        assertThat(blockedResponse.getHeader("Retry-After")).isEqualTo("60");
    }

    @Test
    @DisplayName("POST /api/v1/friends/requests allows 5 attempts, blocks 6th with 429")
    void testFriendRequestRateLimit() throws Exception {
        for (int i = 1; i <= 5; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/v1/friends/requests");
            request.setRemoteAddr("192.168.1.20");
            MockHttpServletResponse response = new MockHttpServletResponse();

            filter.doFilterInternal(request, response, filterChain);
            assertThat(response.getStatus()).isEqualTo(200);
        }

        MockHttpServletRequest blockedRequest = new MockHttpServletRequest("POST", "/api/v1/friends/requests");
        blockedRequest.setRemoteAddr("192.168.1.20");
        MockHttpServletResponse blockedResponse = new MockHttpServletResponse();

        filter.doFilterInternal(blockedRequest, blockedResponse, filterChain);
        assertThat(blockedResponse.getStatus()).isEqualTo(429);
        assertThat(blockedResponse.getContentAsString()).contains("Too many friend requests sent");
    }

    @Test
    @DisplayName("PATCH /api/v1/users/me/password allows 5 attempts, blocks 6th with 429")
    void testPasswordChangeRateLimit() throws Exception {
        for (int i = 1; i <= 5; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest("PATCH", "/api/v1/users/me/password");
            request.setRemoteAddr("192.168.1.30");
            MockHttpServletResponse response = new MockHttpServletResponse();

            filter.doFilterInternal(request, response, filterChain);
            assertThat(response.getStatus()).isEqualTo(200);
        }

        MockHttpServletRequest blockedRequest = new MockHttpServletRequest("PATCH", "/api/v1/users/me/password");
        blockedRequest.setRemoteAddr("192.168.1.30");
        MockHttpServletResponse blockedResponse = new MockHttpServletResponse();

        filter.doFilterInternal(blockedRequest, blockedResponse, filterChain);
        assertThat(blockedResponse.getStatus()).isEqualTo(429);
        assertThat(blockedResponse.getContentAsString()).contains("Too many password change attempts");
    }

    @Test
    @DisplayName("POST /api/auth/register allows 5 attempts, blocks 6th with 429")
    void testRegisterRateLimit() throws Exception {
        for (int i = 1; i <= 5; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/register");
            request.setRemoteAddr("192.168.1.15");
            MockHttpServletResponse response = new MockHttpServletResponse();

            filter.doFilterInternal(request, response, filterChain);
            assertThat(response.getStatus()).isEqualTo(200);
        }

        MockHttpServletRequest blockedRequest = new MockHttpServletRequest("POST", "/api/auth/register");
        blockedRequest.setRemoteAddr("192.168.1.15");
        MockHttpServletResponse blockedResponse = new MockHttpServletResponse();

        filter.doFilterInternal(blockedRequest, blockedResponse, filterChain);
        assertThat(blockedResponse.getStatus()).isEqualTo(429);
        assertThat(blockedResponse.getContentAsString()).contains("Too many registration attempts");
        assertThat(blockedResponse.getHeader("Retry-After")).isEqualTo("60");
    }

    @Test
    @DisplayName("General GET /api/problems allows up to 120 attempts")
    void testGeneralApiRateLimit() throws Exception {
        for (int i = 1; i <= 10; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/problems");
            request.setRemoteAddr("192.168.1.40");
            MockHttpServletResponse response = new MockHttpServletResponse();

            filter.doFilterInternal(request, response, filterChain);
            assertThat(response.getStatus()).isEqualTo(200);
        }
    }

    @Test
    @DisplayName("Spoofed X-Forwarded-For header cannot bypass rate limit")
    void testSpoofedXForwardedForCannotBypassRateLimit() throws Exception {
        // Send 5 requests with the same remoteAddr but different spoofed X-Forwarded-For headers
        for (int i = 1; i <= 5; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
            request.setRemoteAddr("198.51.100.5");
            request.addHeader("X-Forwarded-For", "203.0.113." + i);
            MockHttpServletResponse response = new MockHttpServletResponse();

            filter.doFilterInternal(request, response, filterChain);
            assertThat(response.getStatus()).isEqualTo(200);
        }

        // 6th attempt with yet another spoofed X-Forwarded-For should still be blocked (429)
        MockHttpServletRequest blockedRequest = new MockHttpServletRequest("POST", "/api/auth/login");
        blockedRequest.setRemoteAddr("198.51.100.5");
        blockedRequest.addHeader("X-Forwarded-For", "203.0.113.99");
        MockHttpServletResponse blockedResponse = new MockHttpServletResponse();

        filter.doFilterInternal(blockedRequest, blockedResponse, filterChain);
        assertThat(blockedResponse.getStatus()).isEqualTo(429);
        assertThat(blockedResponse.getContentAsString()).contains("Too many authentication attempts");
    }

    @Test
    @DisplayName("RateLimitingFilter evicts stale entries when tracked bucket count grows large")
    void testStaleRateLimitBucketsAreEvicted() throws Exception {
        // Generate requests across 250 distinct IPs to trigger cleanup threshold (> 200)
        for (int i = 1; i <= 250; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/problems");
            request.setRemoteAddr("10.0." + (i / 256) + "." + (i % 256));
            MockHttpServletResponse response = new MockHttpServletResponse();
            filter.doFilterInternal(request, response, filterChain);
            assertThat(response.getStatus()).isEqualTo(200);
        }

        // New request should succeed normally without memory explosion
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/problems");
        request.setRemoteAddr("10.0.99.99");
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilterInternal(request, response, filterChain);
        assertThat(response.getStatus()).isEqualTo(200);
    }
}
