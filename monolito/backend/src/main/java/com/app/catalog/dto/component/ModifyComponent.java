package com.app.catalog.dto.component;

import java.util.UUID;

public record ModifyComponent(
    UUID projectId,
    UUID variantId,
    UUID componentId,
    String value,
    String comments,
    Integer quantity
) {}
