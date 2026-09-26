package com.example.demo.controller;

import com.example.demo.config.GlobalExceptionHandler;
import com.example.demo.dto.ChangePasswordRequest;
import com.example.demo.model.User;
import com.example.demo.security.CustomUserDetails;
import com.example.demo.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    private MockMvc mockMvcWithAuth;
    private MockMvc mockMvcWithoutAuth;

    private final UUID testUserId = UUID.randomUUID();
    private CustomUserDetails testUserDetails;

    @BeforeEach
    void setUp() {
        User testUser = User.builder()
                .id(testUserId)
                .email("test@example.com")
                .passwordHash("hashedOldPassword")
                .displayName("Tester")
                .build();
        testUserDetails = new CustomUserDetails(testUser);

        HandlerMethodArgumentResolver authenticatedResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.getParameterType().equals(CustomUserDetails.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return testUserDetails;
            }
        };

        HandlerMethodArgumentResolver unauthenticatedResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.getParameterType().equals(CustomUserDetails.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return null;
            }
        };

        mockMvcWithAuth = MockMvcBuilders.standaloneSetup(userController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(authenticatedResolver)
                .build();

        mockMvcWithoutAuth = MockMvcBuilders.standaloneSetup(userController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(unauthenticatedResolver)
                .build();
    }

    @Test
    @DisplayName("PATCH /api/v1/users/me/password succeeds with correct current password and returns 200")
    void changePassword_success() throws Exception {
        doNothing().when(userService).changePassword(eq(testUserId), any(ChangePasswordRequest.class));

        mockMvcWithAuth.perform(patch("/api/v1/users/me/password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"oldPassword123\",\"newPassword\":\"newPassword456\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Password changed successfully"));

        verify(userService, times(1)).changePassword(eq(testUserId), any(ChangePasswordRequest.class));
    }

    @Test
    @DisplayName("PATCH /api/v1/users/me/password rejects wrong current password with 401 Unauthorized")
    void changePassword_wrongCurrentPassword() throws Exception {
        doThrow(new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Current password does not match"))
                .when(userService).changePassword(eq(testUserId), any(ChangePasswordRequest.class));

        mockMvcWithAuth.perform(patch("/api/v1/users/me/password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"wrongPassword\",\"newPassword\":\"newPassword456\"}"))
                .andExpect(status().isUnauthorized());

        verify(userService, times(1)).changePassword(eq(testUserId), any(ChangePasswordRequest.class));
    }

    @Test
    @DisplayName("PATCH /api/v1/users/me/password rejects new password shorter than 8 characters with field error")
    void changePassword_newPasswordTooShort() throws Exception {
        mockMvcWithAuth.perform(patch("/api/v1/users/me/password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"oldPassword123\",\"newPassword\":\"short\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", containsString("newPassword")));

        verify(userService, never()).changePassword(any(), any());
    }

    @Test
    @DisplayName("PATCH /api/v1/users/me/password rejects unauthenticated requests")
    void changePassword_unauthenticated() throws Exception {
        mockMvcWithoutAuth.perform(patch("/api/v1/users/me/password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"oldPassword123\",\"newPassword\":\"newPassword456\"}"))
                .andExpect(status().isUnauthorized());

        verify(userService, never()).changePassword(any(), any());
    }
}
