package com.app.threads.dto;

import com.app.threads.domain.ThreadMessage;

import java.util.UUID;

public record ThreadMessageResponse(
        UUID id,
        UUID threadId,
        UUID userId,
        String content,
        String createdAt
) {
    public static ThreadMessageResponse from(ThreadMessage m) {
        return from(m, m.getThread() != null ? m.getThread().getId() : null);
    }

    public static ThreadMessageResponse from(ThreadMessage m, UUID threadId) {
        return new ThreadMessageResponse(
                m.getId(),
                threadId != null ? threadId : (m.getThread() != null ? m.getThread().getId() : null),
                m.getUserId(),
                m.getContent(),
                m.getCreatedAt() != null ? m.getCreatedAt().toString() : null
        );
    }
}
