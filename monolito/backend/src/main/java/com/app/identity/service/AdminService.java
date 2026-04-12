package com.app.identity.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.identity.domain.Designer;
import com.app.identity.domain.Quoter;
import com.app.identity.domain.Sales;
import com.app.identity.domain.User;
import com.app.identity.dto.RegisterRequest;
import com.app.identity.dto.UserResponse;
import com.app.identity.dto.UserUpdate;
import com.app.identity.repository.DesignerRepository;
import com.app.identity.repository.QuoterRepository;
import com.app.identity.repository.SalesRepository;
import com.app.identity.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final QuoterRepository quoterRepository;
    private final SalesRepository salesRepository;
    private final DesignerRepository designerRepository;
    private final PasswordEncoder passwordEncoder;

    public UserResponse getUserResponse(UUID userId) {
        return userRepository.findById(userId)
                .map(UserResponse::new)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public List<UserResponse> getUsersByIds(List<UUID> userIds) {
        if (userIds == null || userIds.isEmpty()) return List.of();
        return userRepository.findAllById(userIds).stream()
                .map(UserResponse::new)
                .toList();
    }

    @Transactional
    public UserResponse updateUser(UUID userId, UserUpdate userUpdate) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (userUpdate.name() != null) user.setName(userUpdate.name());
        if (userUpdate.email() != null) user.setEmail(userUpdate.email());
        if (userUpdate.phone() != null) user.setPhone(userUpdate.phone());
        if (userUpdate.password() != null && !userUpdate.password().isBlank())
            user.setPassword(passwordEncoder.encode(userUpdate.password()));
        if (userUpdate.role() != null) user.setRole(userUpdate.role());
        if (userUpdate.jobTitle() != null) user.setJobTitle(userUpdate.jobTitle());
        if (userUpdate.isLeader() != null) user.setIsLeader(userUpdate.isLeader());
        user.setUpdatedAt(LocalDateTime.now());
        return new UserResponse(userRepository.save(user));
    }

    @Transactional
    @CacheEvict(value = {"quoters", "sales", "designers", "developers"}, allEntries = true)
    public Boolean createUser(RegisterRequest request) {
        User user = userRepository.save(
                User.builder()
                        .id(UUID.randomUUID())
                        .name(request.name())
                        .email(request.email())
                        .phone(request.phone())
                        .password(passwordEncoder.encode(request.password()))
                        .role(request.role())
                        .jobTitle(request.jobTitle())
                        .isLeader(Boolean.TRUE.equals(request.isLeader()))
                        .createdBy(request.creator())
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .build());

        return switch (request.role()) {
            case "QUOTER" -> {
                quoterRepository.save(Quoter.builder()
                        .id(UUID.randomUUID()).user(user)
                        .products(0).projects(0).quoted(0).build());
                yield true;
            }
            case "SALES" -> {
                salesRepository.save(Sales.builder()
                        .id(UUID.randomUUID()).user(user)
                        .effective(0).requested(0).build());
                yield true;
            }
            case "DESIGNER" -> {
                designerRepository.save(Designer.builder()
                        .id(UUID.randomUUID()).user(user)
                        .created(0).edited(0).build());
                yield true;
            }
            case "DEVELOPMENT" -> true;
            default -> throw new RuntimeException("Invalid role");
        };
    }

    @Transactional
    @CacheEvict(value = {"quoters", "sales", "designers", "developers"}, allEntries = true)
    public Boolean deleteUser(UUID userId) {
        try { quoterRepository.deleteByUserId(userId); } catch (Exception ignored) {}
        try { salesRepository.deleteByUserId(userId); } catch (Exception ignored) {}
        try { designerRepository.deleteByUserId(userId); } catch (Exception ignored) {}
        userRepository.deleteById(userId);
        return true;
    }

    @Transactional
    @CacheEvict(value = {"quoters", "sales", "designers", "developers"}, allEntries = true)
    public Boolean editUser(UUID userId, UserUpdate userUpdate) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (userUpdate.name() != null) user.setName(userUpdate.name());
        if (userUpdate.email() != null) user.setEmail(userUpdate.email());
        if (userUpdate.phone() != null) user.setPhone(userUpdate.phone());
        if (userUpdate.password() != null && !userUpdate.password().isBlank())
            user.setPassword(passwordEncoder.encode(userUpdate.password()));
        if (userUpdate.role() != null) user.setRole(userUpdate.role());
        if (userUpdate.jobTitle() != null) user.setJobTitle(userUpdate.jobTitle());
        if (userUpdate.isLeader() != null) user.setIsLeader(userUpdate.isLeader());
        userRepository.save(user);
        return true;
    }
}
