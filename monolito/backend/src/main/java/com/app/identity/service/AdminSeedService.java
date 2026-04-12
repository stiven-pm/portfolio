package com.app.identity.service;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.app.identity.domain.User;
import com.app.identity.repository.UserRepository;
import com.app.shared.config.AppProperties;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class AdminSeedService {

    private final UserRepository userRepository;
    private final AppProperties appProperties;

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seedAdmin() {
        String email = appProperties.admin().email();
        if (userRepository.findByEmail(email).isPresent()) {
            return;
        }

        User admin = User.builder()
                .id(UUID.randomUUID())
                .name(appProperties.admin().name())
                .email(email)
                .password(appProperties.admin().passwordHash())
                .role("ADMIN")
                .isLeader(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        userRepository.save(admin);
    }
}
