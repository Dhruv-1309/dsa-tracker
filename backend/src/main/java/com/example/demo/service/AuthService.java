package com.example.demo.service;

import com.example.demo.dto.AuthRequest;
import com.example.demo.dto.AuthResponse;
import com.example.demo.dto.GoogleAuthRequest;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.CustomUserDetails;
import com.example.demo.security.JwtService;
import com.example.demo.security.TokenBlacklistService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.Date;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final TokenBlacklistService tokenBlacklistService;
    private final RestClient restClient;

    @Value("${application.security.google.client-id:268901294445-dg2ejtiatbgtfu5jp1vc9mpn5abrrbt7.apps.googleusercontent.com}")
    private String googleClientId;

    public void logout(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String jwt = authHeader.substring(7);
            try {
                Date expiration = jwtService.extractExpiration(jwt);
                tokenBlacklistService.blacklistToken(jwt, expiration.getTime());
            } catch (Exception ignored) {
                // Token already expired or malformed
            }
        }
    }

    public AuthResponse register(AuthRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Email already registered"
            );
        }

        var user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .build();
        
        userRepository.save(user);

        var userDetails = new CustomUserDetails(user);
        var jwtToken = jwtService.generateToken(userDetails, user.getId().toString());
        return AuthResponse.builder()
                .token(jwtToken)
                .build();
    }

    public AuthResponse login(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );
        
        var user = userRepository.findByEmail(request.getEmail())
                .orElseThrow();
        var userDetails = new CustomUserDetails(user);
        var jwtToken = jwtService.generateToken(userDetails, user.getId().toString());
        return AuthResponse.builder()
                .token(jwtToken)
                .build();
    }

    public AuthResponse googleLogin(GoogleAuthRequest request) {
        if (request.getCredential() == null || request.getCredential().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Google credential token cannot be blank");
        }

        Map<String, Object> payload;
        try {
            payload = restClient.get()
                    .uri("https://oauth2.googleapis.com/tokeninfo?id_token={idToken}", request.getCredential().trim())
                    .retrieve()
                    .body(new ParameterizedTypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            log.error("Failed to verify Google ID token with Google tokeninfo endpoint", e);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired Google token");
        }

        if (payload == null || payload.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Empty response from Google verification");
        }

        // Verify audience (aud) matches our configured Google Client ID
        String aud = (String) payload.get("aud");
        if (aud == null || !aud.equals(googleClientId)) {
            log.warn("Google token audience mismatch: expected {}, got {}", googleClientId, aud);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token audience does not match configured client ID");
        }

        // Verify email_verified
        Object emailVerifiedObj = payload.get("email_verified");
        boolean emailVerified = "true".equalsIgnoreCase(String.valueOf(emailVerifiedObj));
        if (!emailVerified) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Google account email is not verified");
        }

        // Extract email
        String email = (String) payload.get("email");
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email not found in Google token");
        }
        email = email.toLowerCase().trim();

        // Extract display name
        String name = (String) payload.get("name");
        if (name == null || name.isBlank()) {
            String givenName = (String) payload.get("given_name");
            String familyName = (String) payload.get("family_name");
            if (givenName != null && !givenName.isBlank()) {
                name = givenName + (familyName != null ? " " + familyName : "");
            }
        }

        final String finalEmail = email;
        final String finalName = name;

        // Find existing user or create a new user account
        User user = userRepository.findByEmailIgnoreCase(finalEmail).orElseGet(() -> {
            User newUser = User.builder()
                    .email(finalEmail)
                    .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .displayName(finalName != null && !finalName.isBlank() ? finalName : finalEmail.split("@")[0])
                    .build();
            return userRepository.save(newUser);
        });

        // Update display name if it was previously empty and Google provides one
        if ((user.getDisplayName() == null || user.getDisplayName().isBlank()) && finalName != null && !finalName.isBlank()) {
            user.setDisplayName(finalName);
            userRepository.save(user);
        }

        var userDetails = new CustomUserDetails(user);
        var jwtToken = jwtService.generateToken(userDetails, user.getId().toString());

        return AuthResponse.builder()
                .token(jwtToken)
                .build();
    }
}
