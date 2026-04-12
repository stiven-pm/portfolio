package com.app.catalog.dto.p3;

import java.util.List;

public record CreateP3Request(
    List<CreateP3Component> components,
    String comment,
    String image
) {}
