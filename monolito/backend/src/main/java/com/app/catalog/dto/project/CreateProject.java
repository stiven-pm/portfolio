package com.app.catalog.dto.project;

import java.util.List;
import java.util.UUID;

import com.app.catalog.dto.p3.CreateP3Request;
import com.app.catalog.dto.variant.CreateVariant;

public record CreateProject(
        String name,
        String client,
        String region,
        String salesName,
        String salesEmail,
        String salesPhone,
        String salesSignature,
        String salesJobTitle,
        UUID salesId,
        String quoterName,
        String quoterEmail,
        UUID quoterId,
        List<CreateVariant> variants,
        List<CreateP3Request> p3s
) {}
