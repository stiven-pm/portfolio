package com.app.document.service;

import java.io.IOException;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.app.document.util.ImageMagicBytes;
import com.app.shared.config.AppProperties;

import lombok.RequiredArgsConstructor;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

@Service
@RequiredArgsConstructor
public class S3Service {

    private final S3Client s3Client;
    private final S3Presigner presigner;
    private final AppProperties appProperties;

    public String upload(MultipartFile file, String type) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Archivo vacío");
        }
        String bucket = resolveBucket(type);
        try {
            if ("image".equalsIgnoreCase(type)) {
                byte[] bytes = file.getBytes();
                ImageMagicBytes.CatalogImage validated;
                try {
                    validated = ImageMagicBytes.validateCatalogImageBytes(bytes);
                } catch (IllegalArgumentException ex) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
                }
                String key = UUID.randomUUID() + validated.extension();
                s3Client.putObject(
                        PutObjectRequest.builder()
                                .bucket(bucket)
                                .key(key)
                                .contentType(validated.contentType())
                                .build(),
                        RequestBody.fromBytes(bytes));
                return key;
            }
            String ext = Optional.ofNullable(file.getOriginalFilename())
                    .filter(f -> f.contains("."))
                    .map(f -> f.substring(f.lastIndexOf(".")))
                    .orElse("");
            String key = UUID.randomUUID() + ext;
            String ct = Optional.ofNullable(file.getContentType()).filter(s -> !s.isBlank())
                    .orElse("application/octet-stream");
            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(bucket)
                            .key(key)
                            .contentType(ct)
                            .build(),
                    RequestBody.fromInputStream(file.getInputStream(), file.getSize()));
            return key;
        } catch (IOException e) {
            throw new RuntimeException("Error uploading file to S3", e);
        }
    }

    public Map<String, String> generateUrls(List<String> keys, String type) {
        String bucket = resolveBucket(type);
        Map<String, String> urlMap = new HashMap<>();
        for (String key : keys) {
            var presignRequest = GetObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofMinutes(60))
                    .getObjectRequest(GetObjectRequest.builder().bucket(bucket).key(key).build())
                    .build();
            urlMap.put(key, presigner.presignGetObject(presignRequest).url().toString());
        }
        return urlMap;
    }

    public void delete(String type, String key) {
        String bucket = resolveBucket(type);
        s3Client.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
    }

    private String resolveBucket(String type) {
        return switch (type.toLowerCase()) {
            case "image" -> appProperties.minio().bucketImages();
            case "model" -> appProperties.minio().bucketModels();
            case "plan"  -> appProperties.minio().bucketPlans();
            default -> throw new IllegalArgumentException("Tipo inválido: " + type);
        };
    }
}
