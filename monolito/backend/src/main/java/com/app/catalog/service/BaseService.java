package com.app.catalog.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.catalog.domain.Base;
import com.app.catalog.domain.Component;
import com.app.catalog.domain.Variant;
import com.app.catalog.dto.component.CreateBaseInitialComponent;
import com.app.catalog.dto.variant.CreateBase;
import com.app.catalog.dto.variant.CreateBaseInitialVariant;
import com.app.catalog.repository.BaseRepository;

import lombok.RequiredArgsConstructor;

@Service("catalogBaseService")
@RequiredArgsConstructor
public class BaseService {

    private final BaseRepository baseRepository;
    private final VariantService variantService;
    private final ComponentService componentService;

    @Transactional
    public Base create(CreateBase createBase) {
        Base base = baseRepository.save(
                Base.builder()
                        .id(UUID.randomUUID())
                        .name(createBase.name())
                        .image(createBase.image())
                        .model(createBase.model())
                        .category(createBase.category())
                        .subcategory(createBase.subcategory())
                        .line(createBase.line())
                        .creatorName(createBase.creatorName())
                        .creatorId(createBase.creatorId())
                        .createdAt(LocalDateTime.now())
                        .build());

        List<CreateBaseInitialVariant> initialVariants = createBase.initialVariants();
        if (initialVariants != null && !initialVariants.isEmpty()) {
            for (int i = 0; i < initialVariants.size(); i++) {
                createInitialVariant(base, initialVariants.get(i), i + 1);
            }
        } else {
            createInitialVariant(base, new CreateBaseInitialVariant(null, List.of()), 1);
        }
        return base;
    }

    private void createInitialVariant(Base base, CreateBaseInitialVariant iv, int variantIndex) {
        String sapRef = iv.sapRef() != null && !iv.sapRef().isBlank()
                ? iv.sapRef()
                : base.getId().toString().substring(0, 8) + "-V" + variantIndex;
        Variant variant = variantService.create(base, sapRef);
        List<CreateBaseInitialComponent> components = iv.components();
        if (components != null && !components.isEmpty()) {
            List<Component> comps = new ArrayList<>();
            int compOrdinal = 0;
            for (CreateBaseInitialComponent c : components) {
                if (c.componentId() == null && !hasSapRefOrCode(c.componentSapRef(), c.componentSapCode())) continue;
                compOrdinal++;
                Component orig = c.componentId() != null ? componentService.findById(c.componentId()).orElse(null) : null;
                String sapRefC, sapCode;
                if (c.componentId() != null) {
                    sapRefC = orig != null ? orig.getSapRef()
                            : (c.componentSapRef() != null && !c.componentSapRef().isBlank()
                                    ? c.componentSapRef().trim()
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
                String name = ComponentVariableKeys.displayNamePreferInput(c.componentName(), orig);
                String val = ComponentVariableKeys.valuePreferInput(c.componentValue(), orig);
                comps.add(componentService.createForVariant(variant, sapRefC, sapCode, name, val, val));
            }
            variantService.setComponents(variant.getId(), comps);
        }
    }

    private static boolean hasSapRefOrCode(String sapRef, String sapCode) {
        return (sapRef != null && !sapRef.isBlank()) || (sapCode != null && !sapCode.isBlank());
    }

    public List<Base> findAll() {
        return baseRepository.findAll();
    }

    public Optional<Base> findById(UUID id) {
        return baseRepository.findById(id);
    }

    @Transactional
    public Base updateFields(UUID id, String name, String image, String model,
            String category, String subcategory, String line) {
        Base base = baseRepository.findById(id)
                .orElseThrow(() -> new IllegalStateException("Base not found"));
        if (name != null) base.setName(name);
        if (image != null) base.setImage(image);
        if (model != null) base.setModel(model);
        if (category != null) base.setCategory(category);
        if (subcategory != null) base.setSubcategory(subcategory);
        if (line != null) base.setLine(line);
        return baseRepository.save(base);
    }

    @Transactional
    public void delete(UUID id) {
        baseRepository.deleteById(id);
    }
}
