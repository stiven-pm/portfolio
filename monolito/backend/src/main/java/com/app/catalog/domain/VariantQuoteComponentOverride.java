package com.app.catalog.domain;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "variant_quote_component_overrides", schema = "catalog", uniqueConstraints = {
    @UniqueConstraint(name = "uk_vq_component", columnNames = {"variant_quote_id", "component_id"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VariantQuoteComponentOverride {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "variant_quote_id", nullable = false)
    private VariantQuote variantQuote;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "component_id", nullable = false)
    private Component component;

    private String value;

    @Column(name = "original_value")
    private String originalValue;
}
