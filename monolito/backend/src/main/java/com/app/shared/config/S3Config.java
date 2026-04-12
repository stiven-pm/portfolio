package com.app.shared.config;

import java.net.URI;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import lombok.RequiredArgsConstructor;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

/**
 * MinIO en Docker: el back habla con {@code http://minio:9000}. Las URLs presignadas deben usar
 * {@code app.minio.public-endpoint} (mismo host/puerto que el navegador usa para Caddy, p. ej.
 * {@code http://localhost}) para que {@code /images/&lt;clave&gt;} sea válido tras el proxy.
 */
@Configuration
@RequiredArgsConstructor
public class S3Config {

    private final AppProperties appProperties;

    private static S3Configuration pathStyle() {
        return S3Configuration.builder().pathStyleAccessEnabled(true).build();
    }

    @Bean
    public S3Client s3Client() {
        var m = appProperties.minio();
        return S3Client.builder()
                .endpointOverride(URI.create(m.endpoint()))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(m.accessKey(), m.secretKey())))
                .region(Region.US_EAST_1)
                .forcePathStyle(true)
                .build();
    }

    @Bean
    public S3Presigner s3Presigner() {
        var m = appProperties.minio();
        return S3Presigner.builder()
                .endpointOverride(URI.create(m.publicEndpoint()))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(m.accessKey(), m.secretKey())))
                .region(Region.US_EAST_1)
                .serviceConfiguration(pathStyle())
                .build();
    }
}
