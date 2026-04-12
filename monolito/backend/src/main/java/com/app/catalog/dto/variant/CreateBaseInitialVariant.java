package com.app.catalog.dto.variant;

import java.util.List;

import com.app.catalog.dto.component.CreateBaseInitialComponent;

public record CreateBaseInitialVariant(
        String sapRef,
        List<CreateBaseInitialComponent> components) {}
