package com.app.identity.dto;

import java.io.Serializable;

public record QuoterResponse(
        UserResponse user,
        Integer quoted,
        Integer projects,
        Integer products) implements Serializable {}
