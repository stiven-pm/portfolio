package com.app.identity.dto;

public record RegisterRequest(
        String name,
        String email,
        String phone,
        String password,
        String role,
        String jobTitle,
        Boolean isLeader,
        String creator) {}
