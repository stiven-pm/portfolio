package com.app.catalog.dto.component;

import java.util.UUID;

public record ComponentIdValue(UUID componentId, String componentName, String value, Boolean modified) {}
