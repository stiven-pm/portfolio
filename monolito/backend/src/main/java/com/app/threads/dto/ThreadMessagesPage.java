package com.app.threads.dto;

import java.util.List;

public record ThreadMessagesPage(List<ThreadMessageResponse> items, PageInfo pageInfo) {}
