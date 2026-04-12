package com.app.catalog.dto.component;

import java.util.UUID;

public record CreateComponent(
    UUID componentId,
    String componentValue,
    Boolean modified,
    String componentName
) {}
