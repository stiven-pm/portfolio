package com.app.catalog.dto.variant;

import java.util.UUID;

public record QuoteVariant(
    UUID projectId,
    UUID variantId,
    UUID variantQuoteId,
    String value,
    Integer elaborationTime,
    String criticalMaterial,
    Integer price,
    UUID quoterId
) {}
