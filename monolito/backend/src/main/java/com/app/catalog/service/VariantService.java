package com.app.catalog.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.catalog.domain.Base;
import com.app.catalog.domain.Component;
import com.app.catalog.domain.Variant;
import com.app.catalog.repository.VariantRepository;

import lombok.RequiredArgsConstructor;

@Service("catalogVariantService")
@RequiredArgsConstructor
public class VariantService {

    private final VariantRepository variantRepository;
    private final ComponentService componentService;

    @Transactional
    public Variant createOrphanP3() {
        return variantRepository.save(
                Variant.builder().id(UUID.randomUUID()).base(null).status("DRAFT").build());
    }

    @Transactional
    public Variant createOrphanProjectLine(String sapRef) {
        return variantRepository.save(
                Variant.builder()
                        .id(UUID.randomUUID())
                        .base(null)
                        .sapRef(sapRef)
                        .sapCode((sapRef != null && !sapRef.isBlank()) ? sapRef : null)
                        .status("DRAFT")
                        .build());
    }

    @Transactional
    public Variant create(Base base, String sapRef) {
        return variantRepository.save(
                Variant.builder()
                        .id(UUID.randomUUID())
                        .base(base)
                        .sapRef(sapRef)
                        .sapCode((sapRef != null && !sapRef.isBlank()) ? sapRef : null)
                        .status("DRAFT")
                        .build());
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

    public List<Variant> findAllWithComponents() {
        return variantRepository.findAllWithComponents();
    }

    public List<Variant> findByBaseId(UUID baseId) {
        return variantRepository.findByBase_Id(baseId);
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
    public Variant cloneVariant(Variant source) {
        return variantRepository.save(
                Variant.builder()
                        .id(UUID.randomUUID())
                        .base(source.getBase())
                        .sapRef(source.getSapRef())
                        .sapCode(source.getSapCode())
                        .status(source.getStatus())
                        .sourceVariantId(source.getId())
                        .build());
    }

    @Transactional
    public Variant cloneVariantCopyingComponents(Variant source) {
        Variant clone = cloneVariant(source);
        if (source.getComponents() != null) {
            for (Component oc : source.getComponents()) {
                String val = oc.getValue() != null ? oc.getValue() : "";
                String orig = oc.getOriginalValue() != null ? oc.getOriginalValue() : val;
                componentService.createForVariant(
                        clone,
                        oc.getSapRef(),
                        oc.getSapCode() != null && !oc.getSapCode().isBlank() ? oc.getSapCode() : oc.getSapRef(),
                        oc.getName(),
                        val,
                        orig);
            }
        }
        return variantRepository.findByIdWithComponents(clone.getId()).orElse(clone);
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
