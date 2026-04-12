package com.app.products.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.app.products.domain.ProductCategory;
import com.app.products.domain.ProductLine;
import com.app.products.domain.ProductSubcategory;
import com.app.products.repository.ProductCategoryRepository;
import com.app.products.repository.ProductLineRepository;
import com.app.products.repository.ProductSubcategoryRepository;

import lombok.AllArgsConstructor;

@Service
@AllArgsConstructor
public class TaxonomyService {

    private final ProductCategoryRepository categoryRepository;
    private final ProductSubcategoryRepository subcategoryRepository;
    private final ProductLineRepository lineRepository;

    public List<ProductCategory> listCategories() {
        return categoryRepository.findAll().stream()
                .sorted((a, b) -> a.getName().compareToIgnoreCase(b.getName()))
                .toList();
    }

    private static String requireTaxonomyName(String raw) {
        if (raw == null) {
            throw new IllegalArgumentException("Nombre requerido");
        }
        String t = raw.trim();
        if (t.isEmpty()) {
            throw new IllegalArgumentException("Nombre requerido");
        }
        return t;
    }

    @Transactional
    public ProductCategory ensureCategory(String rawName) {
        String name = requireTaxonomyName(rawName);
        return categoryRepository.findByNameNormalized(name)
                .orElseGet(() -> categoryRepository.save(ProductCategory.builder()
                        .id(UUID.randomUUID())
                        .name(name)
                        .build()));
    }

    @Transactional
    public ProductSubcategory ensureSubcategory(UUID categoryId, String rawName) {
        String name = requireTaxonomyName(rawName);
        ProductCategory category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("Categoría no encontrada"));
        return subcategoryRepository.findByCategoryIdAndNameNormalized(categoryId, name)
                .orElseGet(() -> subcategoryRepository.save(ProductSubcategory.builder()
                        .id(UUID.randomUUID())
                        .category(category)
                        .name(name)
                        .build()));
    }

    @Transactional
    public ProductLine ensureLine(UUID subcategoryId, String rawName) {
        String name = requireTaxonomyName(rawName);
        ProductSubcategory sub = subcategoryRepository.findById(subcategoryId)
                .orElseThrow(() -> new IllegalArgumentException("Subcategoría no encontrada"));
        return lineRepository.findBySubcategoryIdAndNameNormalized(subcategoryId, name)
                .orElseGet(() -> lineRepository.save(ProductLine.builder()
                        .id(UUID.randomUUID())
                        .subcategory(sub)
                        .name(name)
                        .build()));
    }

    public List<ProductSubcategory> listSubcategories(UUID categoryId) {
        return subcategoryRepository.findByCategoryIdOrderByNameCi(categoryId);
    }

    public List<ProductLine> listLines(UUID subcategoryId) {
        return lineRepository.findBySubcategoryIdOrderByNameCi(subcategoryId);
    }

    public void validateTaxonomyChain(UUID categoryId, UUID subcategoryId, UUID lineId) {
        ProductLine line = lineRepository.findByIdWithHierarchy(lineId)
                .orElseThrow(() -> new IllegalArgumentException("Línea no encontrada"));
        if (!line.getSubcategory().getId().equals(subcategoryId)) {
            throw new IllegalArgumentException("La subcategoría no corresponde a la línea");
        }
        if (!line.getSubcategory().getCategory().getId().equals(categoryId)) {
            throw new IllegalArgumentException("La categoría no corresponde a la línea");
        }
    }

    @Transactional
    public ProductCategory updateCategoryName(UUID id, String name) {
        ProductCategory c = categoryRepository.findById(id)
                .orElseThrow(() -> new IllegalStateException("Categoría no encontrada"));
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Nombre inválido");
        }
        c.setName(name.trim());
        return categoryRepository.save(c);
    }

    @Transactional
    public ProductSubcategory updateSubcategoryName(UUID id, String name) {
        ProductSubcategory s = subcategoryRepository.findById(id)
                .orElseThrow(() -> new IllegalStateException("Subcategoría no encontrada"));
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Nombre inválido");
        }
        s.setName(name.trim());
        return subcategoryRepository.save(s);
    }

    @Transactional
    public ProductLine updateLineName(UUID id, String name) {
        ProductLine l = lineRepository.findById(id)
                .orElseThrow(() -> new IllegalStateException("Línea no encontrada"));
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Nombre inválido");
        }
        l.setName(name.trim());
        return lineRepository.save(l);
    }

    public ProductCategory getCategoryRef(UUID id) {
        return categoryRepository.getReferenceById(id);
    }

    public ProductSubcategory getSubcategoryRef(UUID id) {
        return subcategoryRepository.getReferenceById(id);
    }

    public ProductLine getLineRef(UUID id) {
        return lineRepository.getReferenceById(id);
    }
}
