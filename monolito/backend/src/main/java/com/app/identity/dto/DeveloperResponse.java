package com.app.identity.dto;

import java.io.Serializable;

public record DeveloperResponse(UserResponse user) implements Serializable {}
