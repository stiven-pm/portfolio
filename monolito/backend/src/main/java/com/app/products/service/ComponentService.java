package com.app.products.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.products.dto.CreateComponentInput;
import com.app.products.dto.UpdateComponentInput;
import com.app.products.domain.Component;
import com.app.products.domain.VariableDefinition;
import com.app.products.domain.Variant;
import com.app.products.repository.ProductsComponentRepository;
import com.app.products.repository.ProductsVariantRepository;

import lombok.AllArgsConstructor;

@Service("productsComponentService")
@AllArgsConstructor
public class ComponentService {

    private final ProductsComponentRepository componentRepository;
    private final ProductsVariantRepository variantRepository;
    private final VariableDefinitionService variableDefinitionService;

    @Transactional
    public Component createForVariant(Variant variant, String sapRef, String sapCode, VariableDefinition definition,
            String value, String originalValue) {
        return createForVariant(variant, sapRef, sapCode, definition, value, originalValue, true, false);
    }

    @Transactional
    public Component createForVariant(Variant variant, String sapRef, String sapCode, VariableDefinition definition,
            String value, String originalValue, boolean editable) {
        return createForVariant(variant, sapRef, sapCode, definition, value, originalValue, editable, false);
    }

    @Transactional
    public Component createForVariant(Variant variant, String sapRef, String sapCode, VariableDefinition definition,
            String value, String originalValue, boolean editable, boolean listOnly) {
        String ref = (sapRef != null && !sapRef.isBlank()) ? sapRef.trim() : "c-" + UUID.randomUUID();
        String code = (sapCode != null && !sapCode.isBlank()) ? sapCode.trim() : ref;
        String val = value != null ? value : "";
        String orig = originalValue != null ? originalValue : val;
        return componentRepository.save(
                Component.builder()
                        .id(UUID.randomUUID())
                        .sapRef(ref)
                        .sapCode(code)
                        .variableDefinition(definition)
                        .value(val)
                        .originalValue(orig)
                        .editable(editable)
                        .listOnly(listOnly)
                        .variant(variant)
                        .build());
    }

    @Transactional
    public Component create(CreateComponentInput input) {
        Variant variant = variantRepository.findById(input.variantId())
                .orElseThrow(() -> new IllegalStateException("Variant not found"));
        VariableDefinition def = resolveDefinitionForCreate(input);
        String val = input.value() != null ? input.value() : "";
        return createForVariant(variant, input.sapRef(), input.sapCode(), def, val, val);
    }

    private VariableDefinition resolveDefinitionForCreate(CreateComponentInput input) {
        if (input.variableDefinitionId() != null) {
            return variableDefinitionService.requireById(input.variableDefinitionId());
        }
        if (input.name() != null && !input.name().isBlank()) {
            return variableDefinitionService.findOrCreateByNormalizedName(input.name());
        }
        throw new IllegalArgumentException("variableDefinitionId o name es obligatorio");
    }

    public Optional<Component> findById(UUID id) {
        return componentRepository.findByIdWithDefinition(id);
    }

    public List<Component> findByVariantId(UUID variantId) {
        return componentRepository.findByVariantId(variantId);
    }

    @Transactional
    public Component update(UpdateComponentInput input) {
        Component comp = componentRepository.findByIdWithDefinition(input.id())
                .orElseThrow(() -> new IllegalStateException("Component not found"));
        if (input.sapRef() != null) comp.setSapRef(input.sapRef().trim());
        if (input.sapCode() != null) comp.setSapCode(input.sapCode().trim());
        if (input.variableDefinitionId() != null) {
            comp.setVariableDefinition(variableDefinitionService.requireById(input.variableDefinitionId()));
        }
        if (input.name() != null && !input.name().isBlank()) {
            VariableDefinition vd = comp.getVariableDefinition();
            vd.setName(input.name().trim());
        }
        if (input.value() != null) comp.setValue(input.value());
        return componentRepository.save(comp);
    }

    @Transactional
    public void delete(UUID id) {
        componentRepository.deleteById(id);
    }
}
