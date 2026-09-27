package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class GoogleAuthRequest {

    /**
     * Google ID token credential (from Google Identity Services credential response).
     */
    private String credential;

    /**
     * Google OAuth2 access token (from Google Identity Services OAuth2 token client).
     */
    private String accessToken;
}
