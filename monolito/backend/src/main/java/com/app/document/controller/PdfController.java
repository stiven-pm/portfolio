package com.app.document.controller;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.app.document.service.PdfService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/document/mediaFile")
@RequiredArgsConstructor
public class PdfController {

    private final PdfService pdfService;

    @PostMapping(value = "/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> htmlToPdf(@RequestBody String body) {
        String html = body;
        if (body.trim().startsWith("{")) {
            int start = body.indexOf("\"html\"");
            if (start >= 0) {
                int valueStart = body.indexOf(":", start);
                if (valueStart >= 0) {
                    int quoteStart = body.indexOf("\"", valueStart + 1);
                    if (quoteStart >= 0) {
                        int quoteEnd = body.indexOf("\"", quoteStart + 1);
                        if (quoteEnd > quoteStart) {
                            html = body.substring(quoteStart + 1, quoteEnd)
                                    .replace("\\n", "\n")
                                    .replace("\\\"", "\"");
                        }
                    }
                }
            }
        }
        byte[] pdf = pdfService.htmlToPdf(html);
        return ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=\"document.pdf\"")
                .body(pdf);
    }
}
