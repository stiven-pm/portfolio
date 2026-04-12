package com.app.products.dto;

import java.util.UUID;

public record CreateComponentInput(
        UUID variantId,
        String sapRef,
        String sapCode,
        UUID variableDefinitionId,
        String name,
        String value) {
}
