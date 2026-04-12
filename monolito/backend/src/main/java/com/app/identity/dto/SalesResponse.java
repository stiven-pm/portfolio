package com.app.identity.dto;

import java.io.Serializable;

public record SalesResponse(
        UserResponse user,
        Integer requested,
        Integer effective) implements Serializable {}
