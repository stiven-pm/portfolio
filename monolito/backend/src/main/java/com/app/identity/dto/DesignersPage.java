package com.app.identity.dto;

import java.util.List;

public record DesignersPage(List<DesignerResponse> items, PageInfo pageInfo) {}
