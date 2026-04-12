package com.app.document.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import org.springframework.stereotype.Service;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class PdfService {

    private final ImageEmbedder imageEmbedder;

    public byte[] htmlToPdf(String html) {
        if (html == null || html.isBlank()) {
            return new byte[0];
        }
        ImageEmbedder.EmbeddedPdfHtml embedded = imageEmbedder.embedImagesInHtml(html);
        try {
            return renderToPdf(embedded.html());
        } finally {
            for (Path p : embedded.tempImageFiles()) {
                try {
                    Files.deleteIfExists(p);
                } catch (IOException ignored) {
                }
            }
        }
    }

    private byte[] renderToPdf(String html) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useSlowMode();
            builder.withHtmlContent(html, null);
            builder.toStream(out);
            builder.run();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("PDF: fallo en PdfRendererBuilder: {}", e.toString(), e);
            throw new RuntimeException("Error generando PDF: " + e.getMessage(), e);
        }
    }
}
