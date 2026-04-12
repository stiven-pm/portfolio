package com.app.catalog.dto.variant;

import java.util.List;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class BaseResponse {
    private UUID id;
    private String name;
    private String image;
    private String model;
    private String category;
    private String subcategory;
    private String line;
    private List<VariantResponse> variants;
}
