package com.app.products.domain;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "product_lines", schema = "products")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductLine {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "subcategory_id", nullable = false)
    private ProductSubcategory subcategory;

    @Column(nullable = false, length = 512)
    private String name;

    public UUID getSubcategoryId() {
        return subcategory != null ? subcategory.getId() : null;
    }
}
