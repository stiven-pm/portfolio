package com.app.products.service;

import com.app.products.dto.CreateBaseInitialComponentInput;
import com.app.products.domain.Component;
import com.app.products.domain.VariableDefinition;

final class ComponentVariableResolver {

    private ComponentVariableResolver() {
    }

    static VariableDefinition resolveDefinition(
            CreateBaseInitialComponentInput c,
            Component orig,
            VariableDefinitionService variableDefinitionService) {
        if (c.variableDefinitionId() != null) {
            return variableDefinitionService.requireById(c.variableDefinitionId());
        }
        String label = ComponentVariableKeys.displayNamePreferInput(c.componentName(), orig);
        if (label == null || label.isBlank()) {
            return variableDefinitionService.getPlaceholderDefinition();
        }
        return variableDefinitionService.findOrCreateByNormalizedName(label);
    }
}
