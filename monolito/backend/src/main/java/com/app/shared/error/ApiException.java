package com.app.shared.error;

import lombok.Getter;

@Getter
public class ApiException extends RuntimeException {

    private final String code;

    public ApiException(String code, String message) {
        super(message);
        this.code = code;
    }

    public static ApiException notFound(String message) {
        return new ApiException("NOT_FOUND", message);
    }

    public static ApiException forbidden(String message) {
        return new ApiException("FORBIDDEN", message);
    }

    public static ApiException badRequest(String message) {
        return new ApiException("BAD_REQUEST", message);
    }

    public static ApiException conflict(String message) {
        return new ApiException("CONFLICT", message);
    }
}
