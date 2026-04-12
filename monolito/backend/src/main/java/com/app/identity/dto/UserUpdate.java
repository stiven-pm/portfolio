package com.app.identity.dto;

import java.util.UUID;

public record UserUpdate(
        UUID id,
        String name,
        String email,
        String phone,
        String password,
        String role,
        String jobTitle,
        Boolean isLeader) {}
