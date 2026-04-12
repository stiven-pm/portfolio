package com.app.catalog.dto.variant;

import java.util.List;
import java.util.UUID;

import com.app.catalog.dto.component.ComponentResponse;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class VariantResponse {
    private UUID id;
    private String sapRef;
    private String sapCode;
    private List<ComponentResponse> components;
}
