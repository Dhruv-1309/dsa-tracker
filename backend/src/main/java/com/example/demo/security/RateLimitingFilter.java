package com.example.demo.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    // Maximum 5 attempts per 60 seconds per IP for auth endpoints
    private static final int MAX_AUTH_ATTEMPTS = 5;
    private static final long AUTH_WINDOW_MS = 60_000L; // 1 minute

    private final Map<String, Deque<Long>> requestCounts = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        String uri = request.getRequestURI();

        // Rate limit sensitive authentication endpoints (login, register)
        if (uri.equals("/api/auth/login") || uri.equals("/api/auth/register")) {
            String clientIp = extractClientIp(request);
            String bucketKey = uri + ":" + clientIp;
            long now = System.currentTimeMillis();

            synchronized (requestCounts) {
                Deque<Long> timestamps = requestCounts.computeIfAbsent(bucketKey, k -> new ArrayDeque<>());

                // Purge expired timestamps outside the 1-minute window
                while (!timestamps.isEmpty() && now - timestamps.peekFirst() > AUTH_WINDOW_MS) {
                    timestamps.pollFirst();
                }

                if (timestamps.size() >= MAX_AUTH_ATTEMPTS) {
                    response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.setHeader("Retry-After", "60");

                    String correlationId = UUID.randomUUID().toString();
                    String json = String.format(
                            "{\"error\":\"Too many attempts. Please try again after 60 seconds.\",\"status\":429,\"correlationId\":\"%s\",\"timestamp\":\"%s\"}",
                            correlationId,
                            Instant.now().toString()
                    );
                    response.getWriter().write(json);
                    return;
                }

                timestamps.addLast(now);
            }
        }

        filterChain.doFilter(request, response);
    }

    private String extractClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.trim().isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
