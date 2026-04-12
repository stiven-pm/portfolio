package com.app.identity.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.app.identity.dto.TokenResponse;
import com.app.identity.dto.UserResponse;
import com.app.identity.repository.UserRepository;
import com.app.shared.error.ApiException;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public TokenResponse signIn(String email, String rawPassword) {
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> ApiException.badRequest("Credenciales inválidas"));

        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw ApiException.badRequest("Credenciales inválidas");
        }

        return new TokenResponse(
                new UserResponse(user),
                jwtService.generateToken(user));
    }
}
