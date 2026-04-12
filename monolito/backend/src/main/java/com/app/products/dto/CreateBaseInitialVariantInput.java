package com.app.products.dto;

import java.util.List;

import com.app.products.domain.VariantScope;

public record CreateBaseInitialVariantInput(
        String sapRef,
        String image,
        String model,
        VariantScope variantScope,
        List<CreateBaseInitialComponentInput> components) {
}
