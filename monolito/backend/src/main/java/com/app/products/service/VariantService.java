package com.app.products.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.products.dto.CreateBaseInitialComponentInput;
import com.app.products.dto.CreateVariantInput;
import com.app.products.dto.UpdateVariantInput;
import com.app.products.domain.Base;
import com.app.products.domain.Component;
import com.app.products.domain.VariableDefinition;
import com.app.products.domain.Variant;
import com.app.products.domain.VariantScope;
import com.app.products.repository.ProductsBaseRepository;
import com.app.products.repository.ProductsVariantRepository;

import lombok.AllArgsConstructor;

@Service("productsVariantService")
@AllArgsConstructor
public class VariantService {

    private final ProductsVariantRepository variantRepository;
    private final ProductsBaseRepository baseRepository;
    private final ComponentService componentService;
    private final VariableDefinitionService variableDefinitionService;

    @Transactional
    public Variant create(Base base, String sapRef, String image, String model, VariantScope variantScope) {
        VariantScope scope = variantScope != null ? variantScope : VariantScope.LINE;
        return variantRepository.save(
                Variant.builder()
                        .id(UUID.randomUUID())
                        .base(base)
                        .sapRef(sapRef)
                        .sapCode((sapRef != null && !sapRef.isBlank()) ? sapRef : null)
                        .status("DRAFT")
                        .image(image)
                        .model(model)
                        .variantScope(scope)
                        .build());
    }

    @Transactional
    public Variant create(CreateVariantInput input) {
        if (input.image() == null || input.image().isBlank()) {
            throw new IllegalArgumentException("La variante requiere imagen");
        }
        if (input.model() == null || input.model().isBlank()) {
            throw new IllegalArgumentException("La variante requiere modelo");
        }
        Base base = baseRepository.findById(input.baseId())
                .orElseThrow(() -> new IllegalStateException("Base not found"));
        long count = variantRepository.countByBaseId(base.getId());
        String sapRef = input.sapRef() != null && !input.sapRef().isBlank()
                ? input.sapRef()
                : base.getId().toString().substring(0, 8) + "-V" + (count + 1);
        Variant variant = create(base, sapRef, input.image().trim(), input.model().trim(), input.variantScope());
        List<CreateBaseInitialComponentInput> components = input.components();
        if (components != null && !components.isEmpty()) {
            List<Component> comps = new ArrayList<>();
            int compOrdinal = 0;
            for (CreateBaseInitialComponentInput c : components) {
                if (isSkippableInitialRow(c)) {
                    continue;
                }
                compOrdinal++;
                Component orig = c.componentId() != null ? componentService.findById(c.componentId()).orElse(null) : null;
                String sapRefC, sapCode;
                if (c.componentId() != null) {
                    sapRefC = orig != null ? orig.getSapRef()
                            : (hasSapRefOrCode(c.componentSapRef(), c.componentSapCode())
                                    ? (c.componentSapRef() != null && !c.componentSapRef().isBlank()
                                            ? c.componentSapRef().trim()
                                            : c.componentSapCode().trim())
                                    : ComponentVariableKeys.uniqueStub(sapRef, compOrdinal));
                    sapCode = orig != null ? orig.getSapCode()
                            : (c.componentSapCode() != null && !c.componentSapCode().isBlank()
                                    ? c.componentSapCode().trim()
                                    : sapRefC);
                } else {
                    sapCode = c.componentSapCode() != null && !c.componentSapCode().isBlank()
                            ? c.componentSapCode().trim()
                            : (c.componentSapRef() != null ? c.componentSapRef().trim()
                                    : ComponentVariableKeys.uniqueStub(sapRef, compOrdinal));
                    sapRefC = c.componentSapRef() != null && !c.componentSapRef().isBlank()
                            ? c.componentSapRef().trim()
                            : sapCode;
                }
                VariableDefinition def = ComponentVariableResolver.resolveDefinition(c, orig, variableDefinitionService);
                String val = ComponentVariableKeys.valuePreferInput(c.componentValue(), orig);
                boolean editable = c.componentEditable() == null || c.componentEditable();
                boolean listOnly = Boolean.TRUE.equals(c.componentListOnly());
                comps.add(componentService.createForVariant(variant, sapRefC, sapCode, def, val, val, editable, listOnly));
            }
            setComponents(variant.getId(), comps);
        }
        return findByIdWithComponents(variant.getId()).orElse(variant);
    }

    private static boolean hasSapRefOrCode(String sapRef, String sapCode) {
        return (sapRef != null && !sapRef.isBlank()) || (sapCode != null && !sapCode.isBlank());
    }

    private static boolean isSkippableInitialRow(CreateBaseInitialComponentInput c) {
        return c.componentId() == null
                && !hasSapRefOrCode(c.componentSapRef(), c.componentSapCode())
                && c.variableDefinitionId() == null
                && (c.componentName() == null || c.componentName().isBlank())
                && (c.componentValue() == null || c.componentValue().isBlank());
    }

    @Transactional
    public Variant update(UpdateVariantInput input) {
        Variant variant = variantRepository.findByIdWithComponents(input.id())
                .orElseThrow(() -> new IllegalStateException("Variant not found"));
        if (input.sapRef() != null) {
            String ref = input.sapRef().isBlank() ? null : input.sapRef().trim();
            variant.setSapRef(ref);
            variant.setSapCode(ref);
        }
        if (input.image() != null) {
            variant.setImage(input.image().isBlank() ? null : input.image().trim());
        }
        if (input.model() != null) {
            variant.setModel(input.model().isBlank() ? null : input.model().trim());
        }
        if (input.variantScope() != null) {
            variant.setVariantScope(input.variantScope());
        }
        if (input.components() != null) {
            variant.getComponents().clear();
            int compOrdinal = 0;
            for (CreateBaseInitialComponentInput c : input.components()) {
                if (isSkippableInitialRow(c)) {
                    continue;
                }
                compOrdinal++;
                String vSap = variant.getSapRef() != null ? variant.getSapRef() : "";
                Component orig = c.componentId() != null ? componentService.findById(c.componentId()).orElse(null) : null;
                String sapRefC, sapCode;
                if (c.componentId() != null) {
                    sapRefC = orig != null ? orig.getSapRef()
                            : (hasSapRefOrCode(c.componentSapRef(), c.componentSapCode())
                                    ? (c.componentSapRef() != null && !c.componentSapRef().isBlank()
                                            ? c.componentSapRef().trim()
                                            : c.componentSapCode().trim())
                                    : ComponentVariableKeys.uniqueStub(vSap, compOrdinal));
                    sapCode = orig != null ? orig.getSapCode()
                            : (c.componentSapCode() != null && !c.componentSapCode().isBlank()
                                    ? c.componentSapCode().trim()
                                    : sapRefC);
                } else {
                    sapCode = c.componentSapCode() != null && !c.componentSapCode().isBlank()
                            ? c.componentSapCode().trim()
                            : (c.componentSapRef() != null ? c.componentSapRef().trim()
                                    : ComponentVariableKeys.uniqueStub(vSap, compOrdinal));
                    sapRefC = c.componentSapRef() != null && !c.componentSapRef().isBlank()
                            ? c.componentSapRef().trim()
                            : sapCode;
                }
                VariableDefinition def = ComponentVariableResolver.resolveDefinition(c, orig, variableDefinitionService);
                String val = ComponentVariableKeys.valuePreferInput(c.componentValue(), orig);
                boolean editable = c.componentEditable() == null || c.componentEditable();
                boolean listOnly = c.componentListOnly() != null
                        ? Boolean.TRUE.equals(c.componentListOnly())
                        : (c.componentId() != null && orig != null && orig.isListOnly());
                Component comp = componentService.createForVariant(variant, sapRefC, sapCode, def, val, val, editable, listOnly);
                variant.getComponents().add(comp);
            }
        }
        return variantRepository.save(variant);
    }

    public Optional<Variant> findById(UUID id) {
        return variantRepository.findById(id);
    }

    public Optional<Variant> findByIdWithComponents(UUID id) {
        return variantRepository.findByIdWithComponents(id);
    }

    public List<Variant> findAll() {
        return variantRepository.findAll();
    }

    public List<Variant> findByBaseId(UUID baseId) {
        return variantRepository.findByBaseIdWithComponents(baseId);
    }

    @Transactional
    public void deleteById(UUID id) {
        variantRepository.deleteById(id);
    }

    @Transactional
    public Variant setComponents(UUID variantId, List<Component> components) {
        Variant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new IllegalStateException("Variant not found"));
        variant.getComponents().clear();
        if (components != null) {
            for (Component c : components) {
                c.setVariant(variant);
                variant.getComponents().add(c);
            }
        }
        return variantRepository.save(variant);
    }

    @Transactional
    public Variant updateSapRef(UUID variantId, String sapRef) {
        Variant variant = variantRepository.findById(variantId)
                .orElseThrow(() -> new IllegalStateException("Variant not found"));
        String ref = (sapRef != null && !sapRef.isBlank()) ? sapRef.trim() : null;
        variant.setSapRef(ref);
        variant.setSapCode(ref);
        return variantRepository.save(variant);
    }
}
