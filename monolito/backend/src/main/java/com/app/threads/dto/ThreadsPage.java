package com.app.threads.dto;

import java.util.List;

public record ThreadsPage(List<ThreadResponse> items, PageInfo pageInfo) {}
