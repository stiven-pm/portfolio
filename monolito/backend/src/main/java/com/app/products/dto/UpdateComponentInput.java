package com.app.products.dto;

import java.util.UUID;

public record UpdateComponentInput(
        UUID id,
        String sapRef,
        String sapCode,
        UUID variableDefinitionId,
        String name,
        String value) {
}
