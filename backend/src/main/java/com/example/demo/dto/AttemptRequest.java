package com.example.demo.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class AttemptRequest {
    private LocalDate date;
    private String thinkingResult;
    private String codingResult;
    private String timeComplexity;
    private String spaceComplexity;
    private String confidence;
    private String notes;
    private LocalDate nextRevisitDate;
}
