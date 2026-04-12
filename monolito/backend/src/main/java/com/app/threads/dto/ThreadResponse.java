package com.app.threads.dto;

import com.app.threads.domain.ChatThread;

import java.util.UUID;

public record ThreadResponse(
        UUID id,
        UUID projectId,
        UUID variantId,
        String type,
        String openedAt,
        String closedAt,
        UUID openedBy,
        UUID closedBy
) {
    public static ThreadResponse from(ChatThread t) {
        return new ThreadResponse(
                t.getId(),
                t.getProjectId(),
                t.getVariantId(),
                t.getType(),
                t.getOpenedAt() != null ? t.getOpenedAt().toString() : null,
                t.getClosedAt() != null ? t.getClosedAt().toString() : null,
                t.getOpenedBy(),
                t.getClosedBy()
        );
    }
}
