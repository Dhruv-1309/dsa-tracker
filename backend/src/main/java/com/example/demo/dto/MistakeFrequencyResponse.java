package com.example.demo.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MistakeFrequencyResponse {
    private String mistakeTagName;
    private long count;
}
