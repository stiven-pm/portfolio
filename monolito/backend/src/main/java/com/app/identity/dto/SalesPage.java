package com.app.identity.dto;

import java.util.List;

public record SalesPage(List<SalesResponse> items, PageInfo pageInfo) {}
