package com.app.threads.graphql;

import com.app.threads.domain.ChatThread;
import com.app.threads.domain.ThreadMessage;
import com.app.threads.dto.ThreadMessageResponse;
import com.app.threads.dto.ThreadMessagesPage;
import com.app.threads.dto.ThreadResponse;
import com.app.threads.dto.ThreadsPage;
import com.app.threads.service.ThreadService;

import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.UUID;

@Controller
@RequiredArgsConstructor
public class ThreadsGraphQLController {

    private final ThreadService threadService;

    @QueryMapping
    public ThreadsPage threadsByProject(
            @Argument("projectId") String projectId,
            @Argument("limit") Integer limit,
            @Argument("offset") Integer offset) {
        return threadService.findByProjectPaginated(UUID.fromString(projectId), limit, offset);
    }

    @QueryMapping
    public ThreadMessagesPage threadMessages(
            @Argument("threadId") String threadId,
            @Argument("limit") Integer limit,
            @Argument("offset") Integer offset) {
        return threadService.getMessagesPaginated(UUID.fromString(threadId), limit, offset);
    }

    @MutationMapping
    public ThreadResponse openThread(
            @Argument("projectId") String projectId,
            @Argument("variantId") String variantId,
            @Argument("type") String type,
            @Argument("openedBy") String openedBy) {
        ChatThread t = threadService.open(
                UUID.fromString(projectId),
                variantId != null && !variantId.isBlank() ? UUID.fromString(variantId) : null,
                type,
                UUID.fromString(openedBy));
        return ThreadResponse.from(t);
    }

    @MutationMapping
    public ThreadResponse closeThread(
            @Argument("threadId") String threadId,
            @Argument("closedBy") String closedBy) {
        ChatThread t = threadService.close(UUID.fromString(threadId), UUID.fromString(closedBy));
        return ThreadResponse.from(t);
    }

    @MutationMapping
    public ThreadMessageResponse addThreadMessage(
            @Argument("threadId") String threadId,
            @Argument("userId") String userId,
            @Argument("content") String content) {
        UUID tid = UUID.fromString(threadId);
        ThreadMessage m = threadService.addMessage(tid, UUID.fromString(userId), content);
        return ThreadMessageResponse.from(m, tid);
    }
}
