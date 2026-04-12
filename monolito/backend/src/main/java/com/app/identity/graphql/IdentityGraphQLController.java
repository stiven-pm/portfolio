package com.app.identity.graphql;

import java.util.List;
import java.util.UUID;

import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Controller;

import com.app.identity.dto.DesignersPage;
import com.app.identity.dto.DevelopersPage;
import com.app.identity.dto.QuotersPage;
import com.app.identity.dto.RegisterRequest;
import com.app.identity.dto.SalesPage;
import com.app.identity.dto.TokenResponse;
import com.app.identity.dto.UserResponse;
import com.app.identity.dto.UserUpdate;
import com.app.identity.service.AdminService;
import com.app.identity.service.AuthService;
import com.app.identity.service.UserService;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
public class IdentityGraphQLController {

    private final AuthService authService;
    private final AdminService adminService;
    private final UserService userService;

    @MutationMapping
    public TokenResponse signIn(@Argument("input") LoginInput input) {
        return authService.signIn(input.email(), input.password());
    }

    @QueryMapping
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse admin(@AuthenticationPrincipal Jwt jwt) {
        return adminService.getUserResponse(UUID.fromString(jwt.getSubject()));
    }

    @QueryMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'QUOTER', 'DESIGNER', 'SALES', 'DEVELOPMENT')")
    public List<UserResponse> usersByIds(@Argument("userIds") List<String> userIds) {
        if (userIds == null || userIds.isEmpty()) return List.of();
        return adminService.getUsersByIds(userIds.stream().map(UUID::fromString).toList());
    }

    @MutationMapping
    @PreAuthorize("hasRole('ADMIN')")
    public UserResponse updateAdmin(@AuthenticationPrincipal Jwt jwt,
                                    @Argument("input") UserUpdateInput input) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return adminService.updateUser(userId, toUserUpdate(userId, input));
    }

    @MutationMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Boolean createUser(@Argument("input") RegisterInput input) {
        return adminService.createUser(toRegisterRequest(input));
    }

    @MutationMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Boolean deleteUser(@Argument("userId") String userId) {
        return adminService.deleteUser(UUID.fromString(userId));
    }

    @MutationMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Boolean editUser(@Argument("userId") String userId,
                            @Argument("input") UserUpdateInput input) {
        return adminService.editUser(
                UUID.fromString(userId),
                toUserUpdate(UUID.fromString(userId), input));
    }

    @QueryMapping
    public String health() {
        return "OK";
    }

    @QueryMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'QUOTER', 'DESIGNER', 'SALES', 'DEVELOPMENT')")
    public QuotersPage quoters(@Argument("limit") Integer limit,
                               @Argument("offset") Integer offset) {
        return userService.getQuotersPaginated(limit, offset);
    }

    @QueryMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'QUOTER', 'DESIGNER', 'SALES', 'DEVELOPMENT')")
    public SalesPage sales(@Argument("limit") Integer limit,
                           @Argument("offset") Integer offset) {
        return userService.getSalesPaginated(limit, offset);
    }

    @QueryMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'QUOTER', 'DESIGNER', 'SALES', 'DEVELOPMENT')")
    public DesignersPage designers(@Argument("limit") Integer limit,
                                   @Argument("offset") Integer offset) {
        return userService.getDesignersPaginated(limit, offset);
    }

    @QueryMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'QUOTER', 'DESIGNER', 'SALES', 'DEVELOPMENT')")
    public DevelopersPage developers(@Argument("limit") Integer limit,
                                     @Argument("offset") Integer offset) {
        return userService.getDevelopersPaginated(limit, offset);
    }

    private static UserUpdate toUserUpdate(UUID id, UserUpdateInput input) {
        return new UserUpdate(id, input.name(), input.email(), input.phone(),
                input.password(), input.role(), input.jobTitle(), input.isLeader());
    }

    private static RegisterRequest toRegisterRequest(RegisterInput input) {
        return new RegisterRequest(input.name(), input.email(), input.phone(),
                input.password(), input.role(), input.jobTitle(), input.isLeader(), input.creator());
    }
}
