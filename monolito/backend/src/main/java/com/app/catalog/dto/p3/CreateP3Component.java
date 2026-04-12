package com.app.catalog.dto.p3;

import java.util.UUID;

public record CreateP3Component(
    UUID componentId,
    String componentName,
    String componentValue
) {}
