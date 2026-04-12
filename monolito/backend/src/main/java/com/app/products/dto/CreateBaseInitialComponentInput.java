package com.app.products.dto;

import java.util.UUID;

public record CreateBaseInitialComponentInput(
        UUID componentId,
        UUID variableDefinitionId,
        String componentName,
        String componentSapRef,
        String componentSapCode,
        String componentValue,
        Boolean componentEditable,
        Boolean componentListOnly) {
}
