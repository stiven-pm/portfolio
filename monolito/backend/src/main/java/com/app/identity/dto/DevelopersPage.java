package com.app.identity.dto;

import java.util.List;

public record DevelopersPage(List<DeveloperResponse> items, PageInfo pageInfo) {}
