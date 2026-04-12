package com.app.products.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.products.dto.CreateBaseInput;
import com.app.products.dto.CreateBaseInitialComponentInput;
import com.app.products.dto.CreateBaseInitialVariantInput;
import com.app.products.dto.UpdateBaseInput;
import com.app.products.domain.Base;
import com.app.products.domain.Component;
import com.app.products.domain.VariableDefinition;
import com.app.products.domain.Variant;
import com.app.products.repository.ProductsBaseRepository;

import lombok.AllArgsConstructor;

@Service("productsBaseService")
@AllArgsConstructor
public class BaseService {

    private final ProductsBaseRepository baseRepository;
    private final VariantService variantService;
    private final ComponentService componentService;
    private final TaxonomyService taxonomyService;
    private final VariableDefinitionService variableDefinitionService;

    @Transactional
    public Base create(CreateBaseInput input) {
        if (input.categoryId() == null || input.subcategoryId() == null || input.lineId() == null) {
            throw new IllegalArgumentException("categoryId, subcategoryId y lineId son obligatorios");
        }
        taxonomyService.validateTaxonomyChain(input.categoryId(), input.subcategoryId(), input.lineId());
        UUID id = UUID.randomUUID();
        Base base = baseRepository.save(
                Base.builder()
                        .id(id)
                        .name(input.name())
                        .productCategory(taxonomyService.getCategoryRef(input.categoryId()))
                        .productSubcategory(taxonomyService.getSubcategoryRef(input.subcategoryId()))
                        .productLine(taxonomyService.getLineRef(input.lineId()))
                        .creatorName(input.creatorName())
                        .creatorId(input.creatorId())
                        .createdAt(LocalDateTime.now())
                        .build());

        List<CreateBaseInitialVariantInput> initialVariants = input.initialVariants();
        if (initialVariants == null || initialVariants.isEmpty()) {
            throw new IllegalArgumentException("Debe incluir al menos una variante con imagen, modelo y componentes");
        }
        for (int i = 0; i < initialVariants.size(); i++) {
            createInitialVariant(base, initialVariants.get(i), i + 1);
        }
        return baseRepository.findByIdWithTaxonomy(base.getId()).orElse(base);
    }

    private void createInitialVariant(Base base, CreateBaseInitialVariantInput iv, int variantIndex) {
        if (iv.image() == null || iv.image().isBlank()) {
            throw new IllegalArgumentException("Cada variante requiere imagen");
        }
        if (iv.model() == null || iv.model().isBlank()) {
            throw new IllegalArgumentException("Cada variante requiere modelo");
        }
        String sapRef = iv.sapRef() != null && !iv.sapRef().isBlank()
                ? iv.sapRef()
                : base.getId().toString().substring(0, 8) + "-V" + variantIndex;
        Variant variant = variantService.create(base, sapRef, iv.image().trim(), iv.model().trim(), iv.variantScope());
        List<CreateBaseInitialComponentInput> components = iv.components();
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
            variantService.setComponents(variant.getId(), comps);
        }
    }

    private static boolean isSkippableInitialRow(CreateBaseInitialComponentInput c) {
        return c.componentId() == null
                && !hasSapRefOrCode(c.componentSapRef(), c.componentSapCode())
                && c.variableDefinitionId() == null
                && (c.componentName() == null || c.componentName().isBlank())
                && (c.componentValue() == null || c.componentValue().isBlank());
    }

    private static boolean hasSapRefOrCode(String sapRef, String sapCode) {
        return (sapRef != null && !sapRef.isBlank()) || (sapCode != null && !sapCode.isBlank());
    }

    public List<Base> findAll() {
        return baseRepository.findAllWithTaxonomy();
    }

    public Optional<Base> findById(UUID id) {
        return baseRepository.findByIdWithTaxonomy(id);
    }

    @Transactional
    public Base update(UpdateBaseInput input) {
        Base base = baseRepository.findByIdWithTaxonomy(input.id())
                .orElseThrow(() -> new IllegalStateException("Base not found"));
        if (input.name() != null) base.setName(input.name());
        if (input.categoryId() != null || input.subcategoryId() != null || input.lineId() != null) {
            UUID cat = input.categoryId() != null ? input.categoryId() : base.getProductCategory().getId();
            UUID sub = input.subcategoryId() != null ? input.subcategoryId() : base.getProductSubcategory().getId();
            UUID line = input.lineId() != null ? input.lineId() : base.getProductLine().getId();
            taxonomyService.validateTaxonomyChain(cat, sub, line);
            base.setProductCategory(taxonomyService.getCategoryRef(cat));
            base.setProductSubcategory(taxonomyService.getSubcategoryRef(sub));
            base.setProductLine(taxonomyService.getLineRef(line));
        }
        Base saved = baseRepository.save(base);
        return baseRepository.findByIdWithTaxonomy(saved.getId()).orElse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        Base base = baseRepository.findById(id)
                .orElseThrow(() -> new IllegalStateException("Base not found"));
        baseRepository.delete(base);
    }
}
