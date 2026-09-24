package com.example.demo.dto;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDate;

@Data
@Builder
public class HeatmapEntry {
    private LocalDate date;
    private long count;
}
