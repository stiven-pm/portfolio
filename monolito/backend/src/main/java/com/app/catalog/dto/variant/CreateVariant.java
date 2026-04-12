package com.app.catalog.dto.variant;

import java.util.List;
import java.util.UUID;

import com.app.catalog.dto.component.CreateComponent;

public record CreateVariant(
        UUID variantId,
        UUID baseId,
        String variantSapRef,
        String type,
        String comments,
        Integer quantity,
        String image,
        List<CreateComponent> components
) {}
