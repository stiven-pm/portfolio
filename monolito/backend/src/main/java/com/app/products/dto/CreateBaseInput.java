package com.app.products.dto;

import java.util.List;
import java.util.UUID;

public record CreateBaseInput(
        String name,
        UUID categoryId,
        UUID subcategoryId,
        UUID lineId,
        String creatorName,
        UUID creatorId,
        List<CreateBaseInitialVariantInput> initialVariants) {
}
