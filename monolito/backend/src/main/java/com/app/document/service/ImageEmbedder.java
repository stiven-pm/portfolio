package com.app.document.service;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.imageio.ImageIO;

import org.springframework.stereotype.Service;

import com.app.document.util.ImageMagicBytes;
import com.app.shared.config.AppProperties;

import lombok.RequiredArgsConstructor;
import software.amazon.awssdk.core.sync.ResponseTransformer;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;

/** Sustituye {@code /images/&lt;key&gt;} en HTML por {@code data:...;base64,...} para el renderer PDF. */
@Service
@RequiredArgsConstructor
public class ImageEmbedder {

    public record EmbeddedPdfHtml(String html, List<java.nio.file.Path> tempImageFiles) {}

    private static final Pattern IMG_SRC =
            Pattern.compile("(src\\s*=\\s*)([\"'])([^\"']+)\\2", Pattern.CASE_INSENSITIVE);

    private final S3Client s3Client;
    private final AppProperties appProperties;

    public EmbeddedPdfHtml embedImagesInHtml(String html) {
        if (html == null || html.isEmpty()) {
            return new EmbeddedPdfHtml(html, List.of());
        }
        String bucket = appProperties.minio().bucketImages();
        if (bucket == null || bucket.isBlank()) {
            return new EmbeddedPdfHtml(html, List.of());
        }
        Matcher m = IMG_SRC.matcher(html);
        StringBuffer sb = new StringBuffer();
        while (m.find()) {
            String src = m.group(3).trim().replace("&amp;", "&");
            String out = m.group(0);
            if (!src.startsWith("data:")) {
                String key = objectKeyFromSrc(src);
                if (key != null && !key.isBlank()) {
                    try {
                        byte[] raw = s3Client.getObject(
                                        GetObjectRequest.builder().bucket(bucket).key(key).build(),
                                        ResponseTransformer.toBytes())
                                .asByteArray();
                        PreparedRaster prep = prepareRasterForPdf(raw, key);
                        String b64 = Base64.getEncoder().encodeToString(prep.bytes());
                        out = m.group(1) + m.group(2) + "data:" + prep.mime() + ";base64," + b64 + m.group(2);
                    } catch (Exception ignored) {
                    }
                }
            }
            m.appendReplacement(sb, Matcher.quoteReplacement(out));
        }
        m.appendTail(sb);
        return new EmbeddedPdfHtml(sb.toString(), List.of());
    }

    private record PreparedRaster(byte[] bytes, String mime, String detectedMagic) {}

    private PreparedRaster prepareRasterForPdf(byte[] raw, String key) throws IOException {
        String magic = ImageMagicBytes.detectMimeFromMagic(raw);
        String extMime = mimeForKey(key);
        if (isWebpBytes(raw, magic)) {
            byte[] png = webpToPng(raw, key);
            return new PreparedRaster(png, "image/png", magic != null ? magic : "image/webp(inferred)");
        }
        String useMime = magic != null ? magic : extMime;
        return new PreparedRaster(raw, useMime, magic);
    }

    private static boolean isWebpBytes(byte[] raw, String magicMime) {
        if ("image/webp".equals(magicMime)) {
            return true;
        }
        return raw.length >= 12 && raw[0] == 'R' && raw[1] == 'I' && raw[2] == 'F' && raw[3] == 'F'
                && raw[8] == 'W' && raw[9] == 'E' && raw[10] == 'B' && raw[11] == 'P';
    }

    private static byte[] webpToPng(byte[] webp, String key) throws IOException {
        try (ByteArrayInputStream in = new ByteArrayInputStream(webp);
                ByteArrayOutputStream pngOut = new ByteArrayOutputStream()) {
            BufferedImage img = ImageIO.read(in);
            if (img == null) {
                throw new IOException("ImageIO.read devolvió null para WebP key=" + key);
            }
            if (!ImageIO.write(img, "png", pngOut)) {
                throw new IOException("ImageIO.write PNG sin writer disponible key=" + key);
            }
            return pngOut.toByteArray();
        }
    }

    static String objectKeyFromSrc(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String s = raw.trim();
        int q = s.indexOf('?');
        if (q >= 0) {
            s = s.substring(0, q);
        }
        int i = s.indexOf("/images/");
        if (i >= 0) {
            String k = s.substring(i + "/images/".length()).trim();
            if (k.isEmpty()) {
                return null;
            }
            try {
                return URLDecoder.decode(k, StandardCharsets.UTF_8);
            } catch (Exception e) {
                return k;
            }
        }
        s = s.replaceFirst("^/+", "");
        if (s.contains("..") || s.contains("/")) {
            return null;
        }
        return s.isEmpty() ? null : s;
    }

    private static String mimeForKey(String key) {
        String k = key.toLowerCase();
        if (k.endsWith(".png")) {
            return "image/png";
        }
        if (k.endsWith(".gif")) {
            return "image/gif";
        }
        if (k.endsWith(".webp")) {
            return "image/webp";
        }
        if (k.endsWith(".jpg") || k.endsWith(".jpeg")) {
            return "image/jpeg";
        }
        return "image/jpeg";
    }
}
