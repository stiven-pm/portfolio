package com.app.shared.events;

import java.time.LocalDateTime;
import java.util.UUID;

public record ProjectCreatedEvent(
        UUID eventId,
        LocalDateTime processedAt,
        UUID projectId,
        UUID salesId,
        UUID quoterId,
        int products
) {}
