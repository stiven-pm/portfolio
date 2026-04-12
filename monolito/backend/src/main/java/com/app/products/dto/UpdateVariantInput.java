package com.app.products.dto;

import java.util.List;
import java.util.UUID;

import com.app.products.domain.VariantScope;

public record UpdateVariantInput(
        UUID id,
        String sapRef,
        String image,
        String model,
        VariantScope variantScope,
        List<CreateBaseInitialComponentInput> components) {
}
