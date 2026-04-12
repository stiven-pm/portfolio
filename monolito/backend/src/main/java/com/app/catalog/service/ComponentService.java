package com.app.catalog.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.catalog.domain.Component;
import com.app.catalog.domain.Variant;
import com.app.catalog.domain.VariantQuote;
import com.app.catalog.domain.VariantQuoteComponentOverride;
import com.app.catalog.repository.ComponentRepository;

import lombok.RequiredArgsConstructor;

@Service("catalogComponentService")
@RequiredArgsConstructor
public class ComponentService {

    private final ComponentRepository componentRepository;

    @Transactional
    public Component createForVariant(Variant variant, String sapRef, String sapCode,
            String name, String value, String originalValue) {
        String ref = (sapRef != null && !sapRef.isBlank()) ? sapRef.trim() : "c-" + UUID.randomUUID();
        String code = (sapCode != null && !sapCode.isBlank()) ? sapCode.trim() : ref;
        String display = (name != null && !name.isBlank()) ? name.trim() : "";
        String val = value != null ? value : "";
        String orig = originalValue != null ? originalValue : val;
        return componentRepository.save(
                Component.builder()
                        .id(UUID.randomUUID())
                        .sapRef(ref)
                        .sapCode(code)
                        .name(display)
                        .value(val)
                        .originalValue(orig)
                        .variant(variant)
                        .build());
    }

    @Transactional
    public VariantQuoteComponentOverride createOverride(VariantQuote variantQuote,
            Component component, String value, String originalValue) {
        String val = value != null ? value : "";
        String orig = originalValue != null ? originalValue : val;
        return VariantQuoteComponentOverride.builder()
                .id(UUID.randomUUID())
                .variantQuote(variantQuote)
                .component(component)
                .value(val)
                .originalValue(orig)
                .build();
    }

    @Transactional
    public Component createForP3Variant(Variant variant, String name, String value) {
        String display = (name != null && !name.isBlank()) ? name.trim() : "";
        String val = value != null ? value : "";
        return componentRepository.save(
                Component.builder()
                        .id(UUID.randomUUID())
                        .name(display)
                        .value(val)
                        .originalValue(val)
                        .variant(variant)
                        .build());
    }

    @Transactional
    public Component save(Component component) {
        return componentRepository.save(component);
    }

    public Optional<Component> findById(UUID id) {
        return componentRepository.findById(id);
    }

    public static Optional<Component> findOriginalById(List<Component> originals, UUID id) {
        if (originals == null || id == null) return Optional.empty();
        return originals.stream().filter(c -> id.equals(c.getId())).findFirst();
    }
}
