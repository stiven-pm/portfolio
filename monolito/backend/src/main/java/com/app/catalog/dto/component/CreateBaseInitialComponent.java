package com.app.catalog.dto.component;

import java.util.UUID;

public record CreateBaseInitialComponent(
        UUID componentId,
        String componentName,
        String componentSapRef,
        String componentSapCode,
        String componentValue) {}
