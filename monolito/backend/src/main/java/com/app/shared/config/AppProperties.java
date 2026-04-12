package com.app.shared.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(
        String jwtSecret,
        Minio minio,
        Images images,
        Admin admin
) {
    public record Minio(
            String endpoint,
            String publicEndpoint,
            String accessKey,
            String secretKey,
            String bucketImages,
            String bucketModels,
            String bucketPlans
    ) {}

    public record Images(String publicBaseUrl, String internalBaseUrl) {}

    public record Admin(String email, String passwordHash, String name) {}
}
