package com.app.catalog.service;

import com.app.catalog.domain.Component;

final class ComponentVariableKeys {

    private ComponentVariableKeys() {}

    static String uniqueStub(String variantSapRef, int ordinal) {
        String base = (variantSapRef != null && !variantSapRef.isBlank()) ? variantSapRef.trim() : "VAR";
        return base + "-c" + ordinal;
    }

    static String displayNamePreferInput(String inputName, Component orig) {
        if (inputName != null && !inputName.isBlank()) {
            return inputName.trim();
        }
        if (orig != null && orig.getName() != null && !orig.getName().isBlank()) {
            return orig.getName().trim();
        }
        return null;
    }

    static String valuePreferInput(String inputValue, Component orig) {
        if (inputValue != null) {
            return inputValue;
        }
        if (orig != null && orig.getValue() != null) {
            return orig.getValue();
        }
        return "";
    }
}
