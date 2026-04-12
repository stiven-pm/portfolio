package com.app.catalog.dto.project;

import com.app.catalog.domain.Project;

public record ProjectStateUpdate(Project project, boolean becameQuoted) {}
