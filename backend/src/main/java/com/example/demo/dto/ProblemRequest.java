package com.example.demo.dto;

import lombok.Data;

@Data
public class ProblemRequest {
    private String name;
    private String topic;
    private String link;
    private Integer difficulty;
    private String approachNotes;
    private String status;
    private String confidence;
}
