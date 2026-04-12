package com.app.document.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.app.document.dto.FileUploadResponse;
import com.app.document.service.S3Service;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/document/mediaFile")
@RequiredArgsConstructor
public class S3Controller {

    private final S3Service s3Service;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public FileUploadResponse upload(
            @RequestParam("file") MultipartFile file,
            @RequestParam("type") String type) {
        return new FileUploadResponse(s3Service.upload(file, type));
    }

    @DeleteMapping
    public void delete(@RequestParam String type, @RequestParam String key) {
        s3Service.delete(type, key);
    }

    @PostMapping("/url")
    public Map<String, String> getUrlsBatch(
            @RequestBody List<String> keys,
            @RequestParam String type) {
        return s3Service.generateUrls(keys, type);
    }

    @PutMapping(value = "/replace", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public FileUploadResponse replace(
            @RequestParam String oldKey,
            @RequestParam String type,
            @RequestParam("file") MultipartFile file) {
        String newKey = s3Service.upload(file, type);
        s3Service.delete(type, oldKey);
        return new FileUploadResponse(newKey);
    }
}
