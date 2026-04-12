package com.app.products.dto;

import java.util.List;
import java.util.UUID;

import com.app.products.domain.VariantScope;

public record CreateVariantInput(
        UUID baseId,
        String sapRef,
        String image,
        String model,
        VariantScope variantScope,
        List<CreateBaseInitialComponentInput> components) {
}
