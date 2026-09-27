package com.example.demo.service;

import com.example.demo.dto.GoogleAuthRequest;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.security.CustomUserDetails;
import com.example.demo.security.JwtService;
import com.example.demo.security.TokenBlacklistService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private TokenBlacklistService tokenBlacklistService;

    @Mock
    private RestClient restClient;

    @Mock
    private RestClient.RequestHeadersUriSpec requestHeadersUriSpec;

    @Mock
    private RestClient.RequestHeadersSpec requestHeadersSpec;

    @Mock
    private RestClient.ResponseSpec responseSpec;

    @InjectMocks
    private AuthService authService;

    private static final String CLIENT_ID = "268901294445-dg2ejtiatbgtfu5jp1vc9mpn5abrrbt7.apps.googleusercontent.com";

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "googleClientId", CLIENT_ID);
    }

    @Test
    @DisplayName("googleLogin throws 400 when credential is blank")
    void googleLogin_blankCredential() {
        GoogleAuthRequest request = GoogleAuthRequest.builder().credential("  ").build();

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                authService.googleLogin(request));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
    }

    @Test
    @DisplayName("googleLogin throws 401 when Google tokeninfo call fails")
    void googleLogin_tokenVerificationFails() {
        GoogleAuthRequest request = GoogleAuthRequest.builder().credential("invalid-token").build();

        when(restClient.get()).thenReturn(requestHeadersUriSpec);
        when(requestHeadersUriSpec.uri(any(String.class), any(Object[].class))).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenThrow(new RuntimeException("Bad Request"));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                authService.googleLogin(request));

        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
        assertEquals("Invalid or expired Google token", ex.getReason());
    }

    @Test
    @DisplayName("googleLogin throws 401 when audience does not match client ID")
    void googleLogin_audienceMismatch() {
        GoogleAuthRequest request = GoogleAuthRequest.builder().credential("valid-token").build();

        Map<String, Object> payload = new HashMap<>();
        payload.put("aud", "wrong-client-id.apps.googleusercontent.com");
        payload.put("email_verified", "true");
        payload.put("email", "alex@example.com");

        when(restClient.get()).thenReturn(requestHeadersUriSpec);
        when(requestHeadersUriSpec.uri(any(String.class), any(Object[].class))).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.body(any(ParameterizedTypeReference.class))).thenReturn(payload);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                authService.googleLogin(request));

        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
        assertEquals("Token audience does not match configured client ID", ex.getReason());
    }

    @Test
    @DisplayName("googleLogin throws 401 when email is not verified by Google")
    void googleLogin_emailNotVerified() {
        GoogleAuthRequest request = GoogleAuthRequest.builder().credential("valid-token").build();

        Map<String, Object> payload = new HashMap<>();
        payload.put("aud", CLIENT_ID);
        payload.put("email_verified", "false");
        payload.put("email", "alex@example.com");

        when(restClient.get()).thenReturn(requestHeadersUriSpec);
        when(requestHeadersUriSpec.uri(any(String.class), any(Object[].class))).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.body(any(ParameterizedTypeReference.class))).thenReturn(payload);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                authService.googleLogin(request));

        assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
        assertEquals("Google account email is not verified", ex.getReason());
    }

    @Test
    @DisplayName("googleLogin logs in existing user successfully and generates JWT")
    void googleLogin_existingUser_success() {
        GoogleAuthRequest request = GoogleAuthRequest.builder().credential("valid-token").build();

        Map<String, Object> payload = new HashMap<>();
        payload.put("aud", CLIENT_ID);
        payload.put("email_verified", "true");
        payload.put("email", "alex@example.com");
        payload.put("name", "Alex Developer");

        when(restClient.get()).thenReturn(requestHeadersUriSpec);
        when(requestHeadersUriSpec.uri(any(String.class), any(Object[].class))).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.body(any(ParameterizedTypeReference.class))).thenReturn(payload);

        UUID existingId = UUID.randomUUID();
        User existingUser = User.builder()
                .id(existingId)
                .email("alex@example.com")
                .displayName("Alex Developer")
                .passwordHash("hashed")
                .build();

        when(userRepository.findByEmailIgnoreCase("alex@example.com")).thenReturn(Optional.of(existingUser));
        when(jwtService.generateToken(any(CustomUserDetails.class), eq(existingId.toString()))).thenReturn("mocked-jwt-token");

        var response = authService.googleLogin(request);

        assertNotNull(response);
        assertEquals("mocked-jwt-token", response.getToken());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("googleLogin creates new user when not registered yet and generates JWT")
    void googleLogin_newUser_success() {
        GoogleAuthRequest request = GoogleAuthRequest.builder().credential("valid-token").build();

        Map<String, Object> payload = new HashMap<>();
        payload.put("aud", CLIENT_ID);
        payload.put("email_verified", "true");
        payload.put("email", "newuser@example.com");
        payload.put("name", "New User");

        when(restClient.get()).thenReturn(requestHeadersUriSpec);
        when(requestHeadersUriSpec.uri(any(String.class), any(Object[].class))).thenReturn(requestHeadersSpec);
        when(requestHeadersSpec.retrieve()).thenReturn(responseSpec);
        when(responseSpec.body(any(ParameterizedTypeReference.class))).thenReturn(payload);

        when(userRepository.findByEmailIgnoreCase("newuser@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(any(String.class))).thenReturn("randomEncodedPass");

        UUID newId = UUID.randomUUID();
        User createdUser = User.builder()
                .id(newId)
                .email("newuser@example.com")
                .displayName("New User")
                .passwordHash("randomEncodedPass")
                .build();
        when(userRepository.save(any(User.class))).thenReturn(createdUser);
        when(jwtService.generateToken(any(CustomUserDetails.class), eq(newId.toString()))).thenReturn("new-user-jwt-token");

        var response = authService.googleLogin(request);

        assertNotNull(response);
        assertEquals("new-user-jwt-token", response.getToken());
        verify(userRepository, times(1)).save(any(User.class));
    }
}
