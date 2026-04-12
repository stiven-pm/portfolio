package com.app.catalog.dto.component;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ComponentResponse {
    private UUID id;
    private String sapRef;
    private String sapCode;
    private String name;
    private String value;
    private String originalValue;
    private String catalogOriginalValue;
}
