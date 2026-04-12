package com.app.products.domain;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity(name = "ProductsBase")
@Table(name = "bases", schema = "products")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Base {

    @Id
    private UUID id;

    @OneToMany(mappedBy = "base", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Variant> variants = new ArrayList<>();

    private String name;
    private String image;
    private String model;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private ProductCategory productCategory;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subcategory_id", nullable = false)
    private ProductSubcategory productSubcategory;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "line_id", nullable = false)
    private ProductLine productLine;

    @Column(name = "creator_name")
    private String creatorName;

    @Column(name = "creator_id")
    private UUID creatorId;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "editor_name")
    private String editorName;

    @Column(name = "editor_id")
    private UUID editorId;

    @Column(name = "edited_at")
    private LocalDateTime editedAt;

    public UUID getCategoryId() {
        return productCategory != null ? productCategory.getId() : null;
    }

    public UUID getSubcategoryId() {
        return productSubcategory != null ? productSubcategory.getId() : null;
    }

    public UUID getLineId() {
        return productLine != null ? productLine.getId() : null;
    }

    public String getCategory() {
        return productCategory != null ? productCategory.getName() : null;
    }

    public String getSubcategory() {
        return productSubcategory != null ? productSubcategory.getName() : null;
    }

    public String getLine() {
        return productLine != null ? productLine.getName() : null;
    }
}
