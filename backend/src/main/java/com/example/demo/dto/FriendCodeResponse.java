package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FriendCodeResponse {
    private String code;
    private String friendCode;

    public static FriendCodeResponse of(String code) {
        return FriendCodeResponse.builder()
                .code(code)
                .friendCode(code)
                .build();
    }
}
