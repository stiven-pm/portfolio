package com.app.identity.dto;

import java.io.Serializable;

public record DesignerResponse(
        UserResponse user,
        Integer created,
        Integer edited) implements Serializable {}
