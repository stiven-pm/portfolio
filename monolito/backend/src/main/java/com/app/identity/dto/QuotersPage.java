package com.app.identity.dto;

import java.util.List;

public record QuotersPage(List<QuoterResponse> items, PageInfo pageInfo) {}
