package com.app.products.dto;

import java.util.UUID;

public record UpdateBaseInput(
        UUID id,
        String name,
        UUID categoryId,
        UUID subcategoryId,
        UUID lineId) {
}
