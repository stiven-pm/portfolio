package com.app.products.service;

import com.app.products.domain.Component;

final class ComponentVariableKeys {

    private ComponentVariableKeys() {
    }

    static String uniqueStub(String variantSapRef, int ordinal) {
        String base = (variantSapRef != null && !variantSapRef.isBlank()) ? variantSapRef.trim() : "VAR";
        return base + "-c" + ordinal;
    }

    static String displayNamePreferInput(String inputName, Component orig) {
        if (inputName != null && !inputName.isBlank()) {
            return inputName.trim();
        }
        if (orig != null && orig.getVariableDefinition() != null
                && orig.getVariableDefinition().getName() != null
                && !orig.getVariableDefinition().getName().isBlank()) {
            return orig.getVariableDefinition().getName().trim();
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
