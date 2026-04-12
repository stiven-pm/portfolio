package com.app.document.util;

public final class ImageMagicBytes {

    public record CatalogImage(String contentType, String extension) {}

    private ImageMagicBytes() {}

    public static String detectMimeFromMagic(byte[] b) {
        if (b == null || b.length < 12) {
            return null;
        }
        if (b[0] == (byte) 0xFF && b[1] == (byte) 0xD8 && b[2] == (byte) 0xFF) {
            return "image/jpeg";
        }
        if (b[0] == (byte) 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G') {
            return "image/png";
        }
        if (b.length >= 6 && b[0] == 'G' && b[1] == 'I' && b[2] == 'F' && b[3] == '8') {
            return "image/gif";
        }
        if (b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') {
            return "image/webp";
        }
        return null;
    }

    public static CatalogImage validateCatalogImageBytes(byte[] data) {
        if (data == null || data.length < 3) {
            throw new IllegalArgumentException("Imagen vacía o demasiado pequeña");
        }
        String mime = detectMimeFromMagic(data);
        if (mime == null) {
            throw new IllegalArgumentException(
                    "Formato no admitido: solo JPEG, PNG o GIF (validado por contenido del archivo)");
        }
        if ("image/webp".equals(mime)) {
            throw new IllegalArgumentException("WebP no está admitido; use JPG, PNG o GIF");
        }
        return switch (mime) {
            case "image/jpeg" -> new CatalogImage("image/jpeg", ".jpg");
            case "image/png" -> new CatalogImage("image/png", ".png");
            case "image/gif" -> new CatalogImage("image/gif", ".gif");
            default -> throw new IllegalArgumentException("Formato no admitido: solo JPEG, PNG o GIF");
        };
    }
}
