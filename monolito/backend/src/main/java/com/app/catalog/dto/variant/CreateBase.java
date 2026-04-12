package com.app.catalog.dto.variant;

import java.util.List;
import java.util.UUID;

public record CreateBase(
        String name,
        String image,
        String model,
        String category,
        String subcategory,
        String line,
        String creatorName,
        UUID creatorId,
        List<CreateBaseInitialVariant> initialVariants) {

    public CreateBase(String name, String image, String category, String subcategory,
            String line, String creatorName, UUID creatorId) {
        this(name, image, null, category, subcategory, line, creatorName, creatorId, List.of());
    }
}
