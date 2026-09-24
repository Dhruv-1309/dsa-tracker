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

    // Maximum 5 attempts per 60 seconds per IP for sensitive auth endpoints
    private static final int MAX_AUTH_ATTEMPTS = 5;

    // Maximum 120 requests per 60 seconds per IP for general API endpoints
    private static final int MAX_API_ATTEMPTS = 120;

    private static final long WINDOW_MS = 60_000L; // 1 minute

    private final Map<String, Deque<Long>> requestCounts = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        String uri = request.getRequestURI();

        if (uri.startsWith("/api/")) {
            boolean isAuthEndpoint = uri.equals("/api/auth/login") || uri.equals("/api/auth/register");
            int maxAllowed = isAuthEndpoint ? MAX_AUTH_ATTEMPTS : MAX_API_ATTEMPTS;
            String clientIp = extractClientIp(request);
            String bucketKey = (isAuthEndpoint ? "auth:" + uri : "api:") + clientIp;
            long now = System.currentTimeMillis();

            synchronized (requestCounts) {
                Deque<Long> timestamps = requestCounts.computeIfAbsent(bucketKey, k -> new ArrayDeque<>());

                // Purge expired timestamps outside the 1-minute window
                while (!timestamps.isEmpty() && now - timestamps.peekFirst() > WINDOW_MS) {
                    timestamps.pollFirst();
                }

                if (timestamps.size() >= maxAllowed) {
                    response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.setHeader("Retry-After", "60");

                    String correlationId = UUID.randomUUID().toString();
                    String message = isAuthEndpoint
                            ? "Too many authentication attempts. Please try again after 60 seconds."
                            : "Too many API requests. Please slow down.";

                    String json = String.format(
                            "{\"error\":\"%s\",\"status\":429,\"correlationId\":\"%s\",\"timestamp\":\"%s\"}",
                            message,
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
