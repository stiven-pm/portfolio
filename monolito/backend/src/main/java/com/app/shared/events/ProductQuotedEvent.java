package com.app.shared.events;

import java.time.LocalDateTime;
import java.util.UUID;

public record ProductQuotedEvent(
        UUID eventId,
        LocalDateTime processedAt,
        UUID quoterId,
        boolean requireUpdate
) {}
