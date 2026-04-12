package com.app.threads.repository;

import com.app.threads.domain.ChatThread;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ThreadRepository extends JpaRepository<ChatThread, UUID> {

    List<ChatThread> findByProjectIdOrderByOpenedAtDesc(UUID projectId);

    Page<ChatThread> findByProjectIdOrderByOpenedAtDesc(UUID projectId, Pageable pageable);
}
