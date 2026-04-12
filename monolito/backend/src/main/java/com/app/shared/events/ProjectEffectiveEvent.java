package com.app.shared.events;

import java.util.UUID;

public record ProjectEffectiveEvent(
        UUID eventId,
        UUID projectId,
        UUID salesId,
        boolean effective
) {}
